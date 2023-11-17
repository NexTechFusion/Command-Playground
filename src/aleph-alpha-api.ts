const ALELPH_KEY = "YOURKEY"

export async function img2text(prompt: string, imgBuffer: string) {
    const textRequest: any = {
        data: prompt,
        id: 2,
        type: "text",
        add_prefix_space: true
    };

    const imageRequest: any = {
        data: imgBuffer,
        id: 1,
        // size,
        type: "image",
        // x: 100,
        // y: 0
    };

    const response = await fetch('https://api.aleph-alpha.com/complete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + ALELPH_KEY
        },
        body: JSON.stringify({

            "model": "luminous-extended",
            "adapter": null,
            "prompt": [
                imageRequest,
                textRequest
            ],
            "maximum_tokens": 164,
            "temperature": 0.7,
            "top_k": 10,
            "top_p": 0,
            "presence_penalty": 0,
            "frequency_penalty": 0,
            "repetition_penalties_include_prompt": false,
            "use_multiplicative_presence_penalty": true,
            "best_of": null,
            "n": 1,
            "log_probs": null,
            "stop_sequences": [],
            "tokens": false,
            "disable_optimizations": false,
            "raw_completion": true
        })
    })

    return await response.json();
}

export interface TextRequest {
    data: string;
    id: number;
    type: "text";
}

export interface ImageRequest {
    data: string;
    id: number;
    size: number;
    type: "image";
    x: number;
    y: number;
}