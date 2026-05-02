"""
Gradient utilities: hook-based recording, norm computation, and health diagnosis.

Gradient health thresholds
--------------------------
  vanishing : mean norm < 1e-4
  exploding : mean norm > 100
  healthy   : otherwise
"""
import torch
import torch.nn as nn
from typing import Dict, List, Literal


GradientHealth = Literal["vanishing", "exploding", "healthy"]

VANISHING_THRESHOLD = 1e-4
EXPLODING_THRESHOLD = 100.0


def register_gradient_hooks(
    model: nn.Module,
) -> Dict[str, List[float]]:
    """
    Attach backward hooks to every named parameter that has .grad.
    Returns a shared dict that gets populated during backward passes.

    Usage:
        grad_store = register_gradient_hooks(model)
        loss.backward()
        norms = compute_gradient_norms(grad_store)
    """
    grad_store: Dict[str, List[float]] = {}

    for name, param in model.named_parameters():
        if param.requires_grad:
            grad_store[name] = []

            def make_hook(n: str):
                def hook(grad: torch.Tensor):
                    norm = grad.detach().norm().item()
                    grad_store[n].append(norm)
                return hook

            param.register_hook(make_hook(name))

    return grad_store


def compute_gradient_norms(
    grad_store: Dict[str, List[float]]
) -> Dict[str, float]:
    """
    Compute the mean L2 norm per parameter across all recorded backward passes.
    Returns {param_name: mean_norm}.
    """
    norms: Dict[str, float] = {}
    for name, values in grad_store.items():
        if values:
            norms[name] = float(sum(values) / len(values))
        else:
            norms[name] = 0.0
    return norms


def diagnose_gradients(
    norms: Dict[str, float]
) -> Dict[str, Dict]:
    """
    For each layer return norm + health status + description.

    Returns:
        {
          "layer_name": {
            "norm": float,
            "status": "vanishing" | "exploding" | "healthy",
            "description": str
          }
        }
    """
    diagnosis: Dict[str, Dict] = {}

    for name, norm in norms.items():
        if norm < VANISHING_THRESHOLD:
            status: GradientHealth = "vanishing"
            desc = (
                f"Gradient norm {norm:.2e} is near zero — gradients are vanishing. "
                "Early layers receive almost no learning signal. Consider reducing depth, "
                "using residual connections, or switching to ReLU / GELU activations."
            )
        elif norm > EXPLODING_THRESHOLD:
            status = "exploding"
            desc = (
                f"Gradient norm {norm:.2e} is extremely large — gradients are exploding. "
                "This destabilises training. Apply gradient clipping "
                "(torch.nn.utils.clip_grad_norm_), reduce the learning rate, "
                "or use BatchNorm / LayerNorm."
            )
        else:
            status = "healthy"
            desc = (
                f"Gradient norm {norm:.4f} is in a healthy range "
                f"({VANISHING_THRESHOLD} – {EXPLODING_THRESHOLD})."
            )

        diagnosis[name] = {"norm": norm, "status": status, "description": desc}

    return diagnosis


def summarise_gradient_health(diagnosis: Dict[str, Dict]) -> Dict[str, int]:
    """Return counts of each health status across all layers."""
    counts = {"vanishing": 0, "exploding": 0, "healthy": 0}
    for layer in diagnosis.values():
        counts[layer["status"]] += 1
    return counts
