from setuptools import setup, find_packages

setup(
    name="agentpayy",
    version="1.0.1",
    description="AgentPayyKit Python SDK - Pay-per-call APIs for AI agents",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="AgentPayyKit Team",
    url="https://github.com/AgentPayy/agentpayy",
    packages=find_packages(),
    install_requires=[
        "web3>=6.0.0",
        "requests>=2.28.0",
        "eth-account>=0.9.0",
        "pydantic>=2.0.0"
    ],
    extras_require={
        "crewai": ["crewai>=0.1.0"],
        "langchain": ["langchain>=0.1.0"],
        "dev": ["pytest>=7.0.0", "black>=23.0.0"]
    },
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    keywords="ai agents payments crypto ethereum web3 api monetization"
) 