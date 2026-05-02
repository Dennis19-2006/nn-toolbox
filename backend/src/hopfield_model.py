import torch
import torch.nn as nn
from typing import List, Tuple

class HopfieldNetwork(nn.Module):
    def __init__(self, size: int):
        super().__init__()
        self.size = size
        # Add weights as a buffer so it moves to device correctly and stores properly
        self.register_buffer('weights', torch.zeros(size, size))

    def fit(self, patterns: List[List[int]]):
        """
        Train Hopfield network using Hebbian learning rule.
        Patterns should be 1D lists of -1 and 1.
        """
        if not patterns:
            return
        
        P = torch.tensor(patterns, dtype=torch.float32) # (num_patterns, size)
        
        # Hebbian rule: W = (1/size) * P^T @ P 
        # But we remove self-connections (diagonal = 0)
        W = torch.matmul(P.T, P) / self.size
        W.fill_diagonal_(0)
        
        self.weights = W

    def energy(self, state: torch.Tensor) -> float:
        """Calculate the Hopfield energy of a state."""
        return -0.5 * torch.sum(self.weights * torch.outer(state, state)).item()

    def predict_step(self, state: torch.Tensor, async_update: bool = True) -> Tuple[torch.Tensor, bool]:
        """
        Performs one step of network update.
        Synch: update all neurons at once.
        Asynch: update neurons randomly one by one throughout one epoch.
        Returns the new state and a boolean indicating if convergence was reached (no changes).
        """
        new_state = state.clone()
        has_changed = False
        
        if async_update:
            indices = torch.randperm(self.size)
            for idx in indices:
                # Activation for neuron i = sign(sum(W_ij * S_j))
                activation = torch.dot(self.weights[idx], new_state)
                # Keep state if activation is 0 to avoid oscillation
                new_val = 1.0 if activation > 0 else (-1.0 if activation < 0 else new_state[idx].item())
                if new_val != new_state[idx].item():
                    new_state[idx] = new_val
                    has_changed = True
        else:
            activations = torch.matmul(self.weights, state)
            new_state = torch.where(activations > 0, 1.0, torch.where(activations < 0, -1.0, state))
            if not torch.equal(new_state, state):
                has_changed = True
                
        return new_state, not has_changed

    def predict_sequence(self, initial_state: List[int], max_steps: int = 50, async_update: bool = True) -> List[List[int]]:
        """
        Runs the network until convergence or max_steps, returning the history of states.
        """
        state = torch.tensor(initial_state, dtype=torch.float32)
        history = [state.clone().tolist()]
        
        for _ in range(max_steps):
            state, converged = self.predict_step(state, async_update=async_update)
            history.append(state.clone().tolist())
            if converged:
                break
                
        return history
