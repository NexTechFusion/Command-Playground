export async function segmentImage(imageBase64, box?, inputPoints?, inputLabels?, multimaskOutput?) {
    const apiUrl = 'http://localhost:3023/segment'; // Change this to your actual API endpoint URL

    // Prepare the request body with optional parameters
    const requestBody: any = {
        image: imageBase64,
    };

    if (box) {
        requestBody.box = box;
    }

    if (inputPoints) {
        requestBody.input_points = inputPoints;
    }

    if (inputLabels) {
        requestBody.input_labels = inputLabels;
    }

    if (typeof multimaskOutput === 'boolean') {
        requestBody.multimask_output = multimaskOutput;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorMessage = `Error: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('An error occurred:', error);
        return null; // Handle the error as needed
    }
}