import os
from setuptools import setup, find_packages

setup(
    name="agentpayy",
    version="1.1.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.1",
        "web3>=6.0.0",
        "eth-account>=0.8.0",
    ],
    extras_require={
        "langchain": ["langchain>=0.1.0"],
        "crewai": ["crewai>=0.1.0"],
    },
    author="AgentPayy",
    description="The Economic OS for AI Agents. Instant x402 payments on Base L2.",
    long_description=open("README.md").read() if os.path.exists("README.md") else "",
    long_description_content_type="text/markdown",
    url="https://github.com/AgentPayy/agentpayy-platform",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.9',
)
