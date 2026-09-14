from setuptools import setup, find_packages
import os
import sys
import subprocess

requirements = []
if os.path.exists("requirements.txt"):
    with open("requirements.txt", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                requirements.append(line)

setup(
    name="habit-os",
    version="1.0.0",
    description="Forest Flow Habit OS & Task Management Application",
    author="Alpha4",
    packages=find_packages(),
    py_modules=["validate_env"],
    install_requires=requirements,
    python_requires=">=3.8",
)
