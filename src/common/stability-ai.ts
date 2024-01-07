import { resizeImage } from '../../sdk/main';

export async function refaceImage(imgBuffer: Buffer, width: number, height: number) {

    const pngBuffer = await resizeImage(imgBuffer, 1024, 1024);
    const initImageBlob = new Blob([pngBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('init_image', initImageBlob as any);
    formData.append('init_image_mode', "IMAGE_STRENGTH");
    formData.append('image_strength', "0.4");
    formData.append('steps', "40");
    formData.append('seed', "0");
    formData.append('samples', "1");
    formData.append('text_prompts[0][text]', 'Cute anime style, colorful')
    formData.append('style_preset', "anime");
    formData.append('text_prompts[0][weight]', "1");
    formData.append('text_prompts[1][text]', 'bad')
    formData.append('text_prompts[1][weight]', "-1");

    const response = await fetch(
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: "Bearer sk-lcKPNsTrWvOmcnoglwlksQTQ1zdMXspzucaN7CEEkwzCmsRI",
            },
            body: formData,
        }
    );

    if (!response.ok) {
        throw new Error(`Non-200 response: ${await response.text()}`)
    }

    const responseJSON = await response.json();
    const baseImg = responseJSON.artifacts[0].base64;

    const result = await resizeImage(Buffer.from(baseImg, 'base64'), width, height, false);

    return result;
}