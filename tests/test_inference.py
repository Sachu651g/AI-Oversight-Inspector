"""Tests for inference.py baseline script."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

# Project root is one level up from the tests/ directory
PROJECT_ROOT = Path(__file__).parent.parent.resolve()


@pytest.mark.unit
def test_inference_missing_api_key(monkeypatch):
    """Verify that running inference.py without HF_TOKEN falls back to dry-run and produces output."""
    result = subprocess.run(
        [sys.executable, str(PROJECT_ROOT / "inference.py")],
        capture_output=True,
        text=True,
        cwd=str(PROJECT_ROOT),
        env={k: v for k, v in os.environ.items()
             if k not in ("OPENAI_API_KEY", "HF_TOKEN")},
    )

    # With auto-fallback, inference.py runs dry-run and exits 0
    assert result.returncode == 0
    assert "[START]" in result.stdout
    assert "[END]" in result.stdout
