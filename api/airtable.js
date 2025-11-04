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
    const AIRTABLE_TOKEN = process.env.TOKEN_AIRTABLE;
    const AIRTABLE_BASE_ID = process.env.BASE_ID_AIRTABLE;
    const AIRTABLE_TABLE_ID = process.env.TABLE_ID_AIRTABLE;

    // Debug mejorado
    console.log('🔍 Variables de entorno:', {
        TOKEN_exists: !!AIRTABLE_TOKEN,
        BASE_exists: !!AIRTABLE_BASE_ID,
        TABLE_exists: !!AIRTABLE_TABLE_ID,
        TOKEN_length: AIRTABLE_TOKEN?.length || 0,
        BASE_value: AIRTABLE_BASE_ID || 'undefined',
        TABLE_value: AIRTABLE_TABLE_ID || 'undefined'
    });

    // Verificar que las variables de entorno estén configuradas
    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
        console.error('❌ Variables de entorno faltantes');
        return res.status(500).json({ 
            error: 'Configuración del servidor incompleta',
            debug: {
                token: !!AIRTABLE_TOKEN,
                base: !!AIRTABLE_BASE_ID,
                table: !!AIRTABLE_TABLE_ID
            }
        });
    }

    try {
        if (req.method === 'GET') {
            console.log('📥 GET request recibido');
            
            // Construir URL simple con paginación (SIN ORDENAMIENTO)
            const offset = req.query.offset;
            let airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
            
            if (offset) {
                airtableUrl += `?offset=${encodeURIComponent(offset)}`;
            }
            
            console.log('📡 URL de Airtable:', airtableUrl);
            
            const response = await fetch(airtableUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error de Airtable:', response.status, errorText);
                throw new Error(`Error de Airtable: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Datos obtenidos:', data.records?.length || 0, 'registros');
            return res.status(200).json(data);

        } else if (req.method === 'POST') {
            console.log('📤 POST request recibido');
            
            const { fields } = req.body;

            if (!fields) {
                console.error('❌ Datos inválidos en POST');
                return res.status(400).json({ 
                    error: 'Datos inválidos: se requiere el campo "fields"' 
                });
            }

            console.log('📝 Creando registro con campos:', Object.keys(fields));

            const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

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
                console.error('❌ Error al crear registro:', errorData);
                throw new Error(`Error de Airtable: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log('✅ Registro creado exitosamente:', data.id);
            return res.status(201).json(data);

        } else {
            console.error('❌ Método no permitido:', req.method);
            return res.status(405).json({ 
                error: 'Método no permitido' 
            });
        }

    } catch (error) {
        console.error('💥 Error en el endpoint:', error.message);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}