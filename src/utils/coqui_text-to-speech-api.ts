export async function text2speech(text: string, options?: Options): Promise<any> {
    try {
        const optionsRe = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: 'Bearer ' + options.apiKey
            },
            body: JSON.stringify({
                voice_id: options?.voice_id ?? 'b479aa77-3af6-45b6-9a96-506bd867c5a2',
                name: options?.name ?? 'Tester',
                text,
                speed: options?.speed ?? 1,
                language: options?.language ?? 'en'
            })
        };

        const response = await fetch('https://app.coqui.ai/api/v2/samples/xtts', optionsRe)

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

import * as http from 'https';

export async function text2speechStream(text: string, options?: Options): Promise<NodeJS.ReadableStream> {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL('https://app.coqui.ai/api/v2/samples/xtts/stream');
            const requestOptions = {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: 'Bearer ' + options.apiKey
                }
            };

            const req = http.request(url, requestOptions, (res) => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`HTTP Status Code: ${res.statusCode}`));
                }
                resolve(res);
            });

            req.on('error', (e) => {
                reject(e);
            });

            req.write(JSON.stringify({
                voice_id: options?.voice_id ?? 'b479aa77-3af6-45b6-9a96-506bd867c5a2',
                name: options?.name ?? 'Tester',
                text,
                speed: options?.speed ?? 1,
                language: options?.language ?? 'en'
            }));

            req.end();
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}



interface Options {
    [key: string]: any;
    apiKey: string;
    voice_id?: string;
    name?: string;
    text?: string;
    speed?: number;
    language?: string;
}
