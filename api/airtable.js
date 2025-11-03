// api/airtable.js - Endpoint seguro para Airtable

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Credenciales desde variables de entorno
    const AIRTABLE_TOKEN = process.env.TOKEN;
    const AIRTABLE_BASE_ID = process.env.BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.TABLE_ID;

    // Verificar que las variables de entorno estén configuradas
    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
        return res.status(500).json({ 
            error: 'Configuración del servidor incompleta' 
        });
    }

    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

    try {
        if (req.method === 'GET') {
            // Obtener todos los registros
            const response = await fetch(airtableUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error de Airtable: ${response.status}`);
            }

            const data = await response.json();
            return res.status(200).json(data);

        } else if (req.method === 'POST') {
            // Crear nuevo registro
            const { fields } = req.body;

            if (!fields) {
                return res.status(400).json({ 
                    error: 'Datos inválidos: se requiere el campo "fields"' 
                });
            }

            const response = await fetch(airtableUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error de Airtable: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return res.status(201).json(data);

        } else {
            // Método no permitido
            return res.status(405).json({ 
                error: 'Método no permitido' 
            });
        }

    } catch (error) {
        console.error('Error en el endpoint:', error);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}