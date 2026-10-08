import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client with required User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Route: AI Document Import for Schools
app.post('/api/ai/import-document', async (req, res) => {
  try {
    const { documentText, filename, fileType } = req.body;

    if (!documentText || typeof documentText !== 'string' || !documentText.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le contenu du document est vide ou invalide.' 
      });
    }

    const systemPrompt = `Tu es l'Intelligence Artificielle d'onboarding scolaire pour l'application Plume.
Ton rôle est d'analyser un document (fichier Excel, tableau CSV, relevé de notes, registre d'élèves, feuille de présence, registre financier/scolarité).
Le document peut avoir n'importe quel format de colonnes ou disposition.
Tu dois extraire et normaliser les données dans la structure JSON suivante :

{
  "classes": [
    {
      "name": "Nom de la classe (ex: Terminale C, CM2 Excellence, 6ème A, Grande Section)",
      "level": "Niveau (ex: Petite Section, Moyenne Section, Grande Section, CP, CE1, CE2, CM1, CM2, 6ème, 5ème, 4ème, 3ème, 2nde, 1ère, Terminale)",
      "cycle": "maternelle" | "primaire" | "college" | "lycee",
      "tuitionFee": 850000
    }
  ],
  "students": [
    {
      "firstName": "Prénom de l'élève",
      "lastName": "Nom de l'élève",
      "matricule": "Matricule (garder celui fourni ou générer PLM-2025-XXX)",
      "gender": "M" | "F",
      "birthDate": "YYYY-MM-DD",
      "className": "Nom de la classe associée",
      "guardianName": "Nom du tuteur ou parent",
      "guardianPhone": "Téléphone du parent",
      "paidTuition": nombre (montant déjà réglé),
      "annualTuition": nombre,
      "paymentStatus": "paid" | "partial" | "unpaid"
    }
  ],
  "grades": [
    {
      "studentMatricule": "Matricule",
      "studentName": "Nom de l'élève",
      "className": "Classe",
      "subjectName": "Matière (ex: Mathématiques, Français, Histoire-Géo, SVT...)",
      "assessmentName": "Intitulé (ex: Devoir Surveillé N°1, Évaluation, Contrôle)",
      "score": nombre (sur 20, ou converti sur 20),
      "maxScore": 20,
      "coefficient": nombre (ex: 1, 2, 3, 4, 5),
      "term": "T1" | "T2" | "T3"
    }
  ],
  "payments": [
    {
      "studentMatricule": "Matricule",
      "studentName": "Nom de l'élève",
      "amount": nombre,
      "date": "YYYY-MM-DD",
      "method": "especes" | "virement" | "cheque" | "mobile_money",
      "receiptNumber": "Numéro de quittance (ex: REC-2025-0101)",
      "notes": "Motif du règlement"
    }
  ],
  "attendance": [
    {
      "studentMatricule": "Matricule",
      "date": "YYYY-MM-DD",
      "status": "absent" | "retard" | "present",
      "reason": "Motif si spécifié",
      "isJustified": true | false
    }
  ],
  "summary": "Résumé en français en 1 ou 2 phrases claires détaillant ce que l'IA a détecté et extrait avec succès."
}

Consignes impératives :
1. Si le document contient des élèves sans matricule, attribue-leur un matricule unique au format "PLM-2025-XXX".
2. Normalise les cycles :
   - Maternelle (Petite Section, Moyenne Section, Grande Section) -> "maternelle"
   - Primaire (CP, CE1, CE2, CM1, CM2) -> "primaire"
   - Collège (6ème, 5ème, 4ème, 3ème) -> "college"
   - Lycée (2nde, 1ère, Terminale) -> "lycee"
3. Réponds UNIQUEMENT avec un JSON valide.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: `DOCUMENT À ANALYSER (${filename || 'document'}):\n\n${documentText.slice(0, 50000)}` }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const clean = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(clean);
    }

    return res.json({
      success: true,
      data: parsedData
    });
  } catch (err: any) {
    console.error('Error during AI document analysis:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Erreur lors du traitement par Gemini API.'
    });
  }
});

// Vite Middleware for Dev, Static Serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Plume Server] Server listening on port ${PORT}`);
  });
}

startServer();
