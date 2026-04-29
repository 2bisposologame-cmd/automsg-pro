import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // Verifica créditos
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('credits, plano')
      .eq('user_id', user.id)
      .maybeSingle();

    if (perfilError) {
      console.error('Erro ao buscar perfil:', perfilError.message);
    }

    if (!perfil) {
      // Cria perfil se não existir (5 créditos)
      const { data: newPerfil, error: createError } = await supabase
        .from('perfis')
        .insert({ user_id: user.id, credits: 5, plano: 'gratuito' })
        .select()
        .single();
      
      if (createError) {
        console.error('Erro ao criar perfil:', createError.message);
        return NextResponse.json({ error: "Erro ao criar perfil" }, { status: 500 });
      }
      
      if (newPerfil) perfil = newPerfil;
    }
    
    if (perfil && perfil.credits <= 0 && perfil.plano === 'gratuito') {
      return NextResponse.json({ error: "Sem créditos. Assine o Plano Pro." }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    let contractText = "";

    // Lógica para detectar se é arquivo ou texto direto
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const pdfData = await pdfParse(buffer);
      contractText = pdfData.text;
    } else {
      const body = await req.json();
      contractText = body.contractText;
    }

    if (!contractText || contractText.length < 10) {
      return NextResponse.json({ error: "Conteúdo insuficiente para análise." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Você é um Advogado Especialista em LGPD.
      Analise o texto e retorne JSON válido:
      {
        "score": número 0-100,
        "status": "crítico"|"médio"|"seguro",
        "riscos": ["string1", "string2"],
        "sugestoes": ["string1", "string2"]
      }
      Texto: ${contractText.substring(0, 15000)}
    `;

    const result = await model.generateContent(prompt);
    const auditData = JSON.parse(result.response.text());

    try {
      // Consome um crédito se for plano gratuito
      if (perfil?.plano === 'gratuito' && perfil?.credits > 0) {
        await supabase
          .from('perfis')
          .update({ credits: perfil.credits - 1 })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase.from('relatorios').insert({
        user_id: user.id,
        nome_arquivo: req.headers.get('x-filename') || 'Texto colado',
        score: auditData.score,
        status: auditData.status,
        riscos: auditData.riscos,
        sugestoes: auditData.sugestoes,
        texto_extraido: contractText.substring(0, 5000)
      }).select();
      
      if (error) {
        console.error('Erro ao salvar no Supabase:', error.message, error.details, error.hint);
      } else {
        console.log('Relatório salvo com sucesso:', data);
      }
    } catch (dbError: any) {
      console.error('Erro ao salvar no Supabase:', dbError.message);
    }

    return NextResponse.json(auditData);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}