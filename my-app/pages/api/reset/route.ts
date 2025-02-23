// pages/api/reset.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { JSONResponse } from "next/dist/server/api-utils"; // if needed

export async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Use a non-public env variable here (make sure it is defined in your .env.local)
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL;
    if (!pythonBackendUrl) {
      return res.status(500).json({ error: "Python backend URL is not configured." });
    }

    // Call your Python backend DELETE /reset endpoint
    const response = await fetch(`${pythonBackendUrl}/reset`, {
      method: "DELETE",
    });

    // Parse JSON response
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
