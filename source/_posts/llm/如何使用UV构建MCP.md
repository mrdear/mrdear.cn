---
title: 使用UV构建MCP的过程记录
subtitle: UV构建MCP过程中遇到的问题
cover: https://resource.libx.fun/pic/2025/05/20250524125130519.png
author: 
  nick: 屈定
tags:
  - LLM
  - MCP
categories: LLM
urlname: llm_uv_mcp
date: 2025-05-23 12:43:53
updated: 2025-05-23 12:43:56
---

作为一个Python小白，在写mcp实现的时候有很多疑问，本文记录在发布mcp过程中，逐步探索解决问题的路线。也很感慨，在这个大模型时代，新鲜东西的学习以及问题解决速度得到了巨大的提升。

## MCP中的上下文数据怎么传递

### 外部参数怎么传递到MCP？

一个简洁的MCP引用如下所示，参数区域分为了args和env，args对应了代码中使用`argparse`，env对应了`os.getenv`方式，两种都是MCP主流的参数传递形式。
```json
{
  "mcpServers": {
    "base64mcp": {
      "command": "uvx",
      "args": [
        "base64mcp"
      ],
      "env": {
        "TO_LOWER": true,
        "TO_UPPER": false
      }
    }
  }
}
```

### tools中如何获取外部参数？
tools的注释以及参数都是要渲染给LLM的提示词部分，因此tools想要获取对应的参数信息就显得比较麻烦，在python mcp sdk中提供了context这个对象，可以获取session级别的信息，或者request级别的信息，如下代码所示，定义了lifespan(session维度)后，在tools中可以通过context的一系列get方法获取到定义的上下文。
```python
    # 定义投传参数
    @asynccontextmanager
    async def server_lifespan(server: Server) -> AsyncIterator[dict]:
        """Manage server startup and shutdown lifecycle."""
        yield {"client": Client(env)}

    mcp = FastMCP(name="base64-mcp", lifespan=server_lifespan)

    @mcp.tool("encode")
    def encode(data: str):
        ......
        client = mcp.get_context().request_context.lifespan_context['client']
        ......
```

## uvx mcp是怎么实现的
`uvx base64mcp`就能执行一个mcp server，这其中的原理主要是`uvx`允许用户在不显式创建虚拟环境的情况下，直接运营Python包中定义的可执行应用。具体流程如下：
1. **包的定位与获取**：当你执行 `uvx base64mcp` 时， 会首先在其缓存中查找 `base64mcp` 这个包。如果缓存中没有，或者版本不符合要求，它会从配置的 Python 包索引（例如 PyPI）下载这个包。 `uv`
2. **依赖解析与安装**： 会解析 `base64mcp` 包的依赖关系，并下载所有必需的依赖包。
3. **隔离环境的创建与执行**：`uvx` 会创建一个临时的、隔离的环境，并将 `base64mcp` 及其依赖安装到这个环境中。然后，它会查找并执行 `base64mcp` 包中定义的入口点（entry point）。这个入口点通常是在包的 `pyproject.toml` 文件中通过 `[project.scripts]` 或 `[project.gui-scripts]` 指定的，或者是一个可执行的模块（例如，一个 `__main__.py` 文件）。

因此对于开发来说最主要的就是第三步，需要在`[project.scripts]`中定义相关的执行命令，并且这个命令要和包名一致，这样解析包并且下载执行一气呵成。如下面代码所示，base64mcp这个命令映射到了具体的包base64mcp下的文件main中的main_cli函数。

```toml
[project]
name = "base64mcp"
version = "0.1.1"
description = "一个使用 FastMCP 实现的 Base64 编码和解码工具。"


# 定义命令行脚本
[project.scripts]
base64mcp = "base64mcp.main:main_cli"
```

## 如何打包发布到pypi
项目开发完毕后，使用`uv build`可以在当前文件夹下创建dist目录，打包产出分为`**.tar.gz`,`**.whl`两种格式。

- `**.tar.gz`：这是源代码分发包（Source Distribution, sdist）。它包含了项目的所有源代码、构建脚本（如 `pyproject.toml`）以及其他必要的文件（如 `README.md`）。当用户或工具需要从源代码构建项目时，会使用这种格式。它具有较好的跨平台兼容性，因为它可以被不同操作系统和 Python 环境用来构建和安装。
- `**.whl`：这是构建分发包（Built Distribution），也称为 Wheel 文件。它是一种预编译的包格式，通常包含了已经编译好的 Python 代码（`.pyc` 文件）和可能的 C 扩展模块。Wheel 文件的安装速度比源代码分发包快，因为它跳过了构建过程。Wheel 文件有不同的类型，以适应不同的操作系统和 Python 版本（例如，`cp39-cp39-manylinux_2_17_x86_64.whl` 表示兼容 CPython 3.9 的 manylinux 平台）。使用 `uv build` 默认会尝试构建通用 Wheel（`py3-none-any.whl`），这意味着它只包含纯 Python 代码，并且不依赖特定的 C 扩展或平台特性，因此可以在任何支持 Python 3 的系统上安装。

接下来使用`twine upload dist/*`，将产出上传到pypi上，在此过程中需要输入pypi上的账户token，整个过程丝滑无审核，相比maven中央仓库的管理确实轻量级很多。

## Example
- https://github.com/mrdear/mcp-example

![https://resource.libx.fun/pic/2025/05/20250524124618414.png](https://resource.libx.fun/pic/2025/05/20250524124618414.png)