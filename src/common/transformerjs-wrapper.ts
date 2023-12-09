//Quick workaround
export let RawImage;
export let AutoProcessor;
export let CLIPVisionModelWithProjection;
export let pipeline;

export async function initTransformers() {
    const TransformersApi = Function('return import("@xenova/transformers")')();
    const loaded = await TransformersApi;
    RawImage = loaded.RawImage;
    AutoProcessor = loaded.AutoProcessor;
    CLIPVisionModelWithProjection = loaded.CLIPVisionModelWithProjection;
    pipeline = loaded.pipeline;
}
