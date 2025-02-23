import type { NextApiRequest, NextApiResponse } from "next";

export async function DELETE(req: NextApiRequest, res: NextApiResponse) {
    // if (req.method !== "DELETE") {
    //     return res
    //     .status(405)
    //     .json({ error: "Method not allowed. Use DELETE." });
    // }

    try {
        // Get your Python backend URL from environment variables
        const pythonBackendUrl = process.env.PYTHON_BACKEND_URL;
        if (!pythonBackendUrl) {
        return res
            .status(500)
            .json({ error: "Python backend URL is not configured." });
        }

        // Make a DELETE request to your Python backend's reset endpoint
        const response = await fetch(`${pythonBackendUrl}/reset`, {
        method: "DELETE",
        });

        const result = await response.json();

        if (response.ok) {
        return res.status(200).json(result);
        } else {
        return res.status(response.status).json(result);
        }
    } catch (error: any) {
        return res.status(500).json({
        error: "Error calling the Python backend.",
        details: error.toString(),
        });
    }
}
