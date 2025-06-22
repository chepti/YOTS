// Vercel Serverless Function
// POST /api/summarize
// Receives WhatsApp chat log as plain text in the body.
// Returns a JSON with a summary of participants and message counts.

// This regex is designed to capture lines that start with a WhatsApp timestamp.
// e.g., "[20/05/2024, 22:39:41] Some Name: Some message"
// It handles both RTL and LTR markers that can sometimes appear in exported chats.
const WHATSAPP_MESSAGE_REGEX = /^[\u200E\u200F]?\[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}:\d{2})\] (.*?): (.*)/;

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', ['POST']);
        return response.status(405).end('Method Not Allowed');
    }

    try {
        const chatText = request.body;
        if (!chatText || typeof chatText !== 'string') {
            return response.status(400).json({ error: 'Request body must be a non-empty string.' });
        }
        
        const lines = chatText.split('\n');
        const participants = {};

        for (const line of lines) {
            const match = line.match(WHATSAPP_MESSAGE_REGEX);
            
            // If the line matches the pattern of a WhatsApp message
            if (match) {
                // The sender's name is the 3rd capture group
                const sender = match[3].trim();
                
                // Exclude system messages that might be caught
                if (sender) {
                    participants[sender] = (participants[sender] || 0) + 1;
                }
            }
        }
        
        // Check if any participants were found
        if (Object.keys(participants).length === 0) {
            return response.status(400).json({ error: 'Could not parse any messages from the file. Please check the file format.' });
        }

        // Return the summary as JSON
        return response.status(200).json({ participants });

    } catch (error) {
        console.error('Error processing chat file:', error);
        return response.status(500).json({ error: 'An internal server error occurred.' });
    }
} 