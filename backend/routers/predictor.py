from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/predictor", tags=["predictor"])

# We initialize it lazily to avoid startup delay if it takes time.
generator = None

class PredictionRequest(BaseModel):
    text: str
    max_new_tokens: int = 5

@router.post("/predict")
async def predict_next_word(req: PredictionRequest):
    global generator
    if generator is None:
        try:
            from transformers import pipeline
            # distilgpt2 is relatively small and fast for text generation
            generator = pipeline('text-generation', model='distilgpt2')
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")
            
    try:
        # Generate text
        results = generator(
            req.text, 
            max_new_tokens=req.max_new_tokens, 
            num_return_sequences=1, 
            do_sample=True, 
            top_k=50, 
            top_p=0.95
        )
        
        generated_text = results[0]['generated_text']
        
        # Isolate the newly generated text difference
        if generated_text.startswith(req.text):
            new_text = generated_text[len(req.text):]
        else:
            new_text = generated_text
            
        return {
            "original": req.text, 
            "generated_text": generated_text, 
            "new_text": new_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
