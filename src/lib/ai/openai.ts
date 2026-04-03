export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    // Mock mode: return helpful canned responses
    return getMockResponse(messages[messages.length - 1].content)
  }
  
  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate AI response')
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}

function getMockResponse(userMessage: string): string {
  // Pattern match common questions and return helpful responses
  const lower = userMessage.toLowerCase()
  
  if (lower.includes('acessar') || lower.includes('acesso') || lower.includes('entrar')) {
    return 'Para acessar seu curso, vá em "Meus Cursos" no menu lateral. Se o curso não aparecer, verifique se o pagamento foi confirmado na seção "Meu Pagamento". Caso o problema persista, clique em "Falar com humano" para suporte.'
  }
  
  if (lower.includes('pagamento') || lower.includes('pagar') || lower.includes('pix') || lower.includes('boleto') || lower.includes('cartão')) {
    return 'Após o pagamento, a liberação do curso pode levar alguns minutos. Para pagamentos via PIX, a confirmação é quase instantânea. Para boleto, pode levar até 3 dias úteis. Verifique o status em "Meus Cursos".'
  }
  
  if (lower.includes('progresso') || lower.includes('concluído') || lower.includes('aula')) {
    return 'Seu progresso é salvo automaticamente! Acesse "Meus Cursos" para ver o progresso de cada curso. As aulas concluídas ficam marcadas com um check verde.'
  }
  
  if (lower.includes('certificado') || lower.includes('certificação')) {
    return 'Ao concluir todas as aulas de um curso, você poderá baixar seu certificado na página do curso em "Meus Cursos". O certificado fica disponível imediatamente após a conclusão.'
  }
  
  if (lower.includes('senha') || lower.includes('login') || lower.includes('esqueci')) {
    return 'Se esqueceu sua senha, clique em "Esqueci minha senha" na página de login. Você receberá um email com instruções para redefinir sua senha. Verifique também a pasta de spam.'
  }
  
  if (lower.includes('reembolso') || lower.includes('cancelar') || lower.includes('devolução')) {
    return 'Para solicitar reembolso ou cancelar uma compra, entre em contato com nosso suporte clicando em "Falar com humano". Analisaremos seu caso em até 7 dias úteis conforme nossa política de reembolso.'
  }
  
  if (lower.includes('professor') || lower.includes('instrutor') || lower.includes('teacher')) {
    return 'Se você é professor e deseja publicar cursos na plataforma, acesse a área "Professor" no menu. Lá você pode criar e gerenciar seus cursos, acompanhar alunos e visualizar seus ganhos.'
  }
  
  if (lower.includes('humano') || lower.includes('atendente') || lower.includes('suporte') || lower.includes('ajuda')) {
    return 'Vou conectar você com um atendente humano. Por favor, descreva sua dúvida ou problema para que possamos ajudar da melhor forma possível. Nossa equipe responderá em até 24 horas úteis.'
  }
  
  // Default response
  return 'Entendi sua dúvida! Posso ajudar com acesso a cursos, pagamentos, progresso, certificados e uso da plataforma. Se preferir, clique em "Falar com humano" para contato direto com nossa equipe.'
}
