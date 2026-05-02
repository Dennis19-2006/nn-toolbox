import numpy as np

class HopfieldNetwork:
    def __init__(self, size: int):
        self.size = size
        self.weights = np.zeros((size, size))

    def fit(self, patterns: List[List[int]]):
        if not patterns:
            return
        
        P = np.array(patterns, dtype=np.float32) 
        W = np.dot(P.T, P) / self.size
        np.fill_diagonal(W, 0)
        self.weights = W

    def energy(self, state: np.ndarray) -> float:
        return -0.5 * np.sum(self.weights * np.outer(state, state))

    def predict_step(self, state: np.ndarray, async_update: bool = True) -> Tuple[np.ndarray, bool]:
        new_state = state.copy()
        has_changed = False
        
        if async_update:
            indices = np.random.permutation(self.size)
            for idx in indices:
                activation = np.dot(self.weights[idx], new_state)
                new_val = 1.0 if activation > 0 else (-1.0 if activation < 0 else new_state[idx])
                if new_val != new_state[idx]:
                    new_state[idx] = new_val
                    has_changed = True
        else:
            activations = np.dot(self.weights, state)
            new_state = np.where(activations > 0, 1.0, np.where(activations < 0, -1.0, state))
            if not np.array_equal(new_state, state):
                has_changed = True
                
        return new_state, not has_changed

    def predict_sequence(self, initial_state: List[int], max_steps: int = 50, async_update: bool = True) -> List[List[int]]:
        state = np.array(initial_state, dtype=np.float32)
        history = [state.copy().tolist()]
        
        for _ in range(max_steps):
            state, converged = self.predict_step(state, async_update=async_update)
            history.append(state.copy().tolist())
            if converged:
                break
                
        return history
