import jsPDF from 'jspdf';

export function generateReportPDF(report: any) {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(26, 115, 232);
  doc.text('Audit.AI - Relatorio de Conformidade', 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Arquivo: ${report.nome_arquivo}`, 20, 30);
  doc.text(`Data: ${new Date(report.created_at).toLocaleDateString('pt-BR')}`, 20, 37);
  
  // Score e Status
  doc.setFontSize(16);
  doc.setTextColor(32, 33, 36);
  doc.text(`Score de Conformidade: ${report.score}/100`, 20, 50);
  
  doc.setFontSize(14);
  const statusColor = report.status === 'critico' ? [217, 48, 37] : report.status === 'medio' ? [227, 116, 0] : [24, 128, 56];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${report.status.toUpperCase()}`, 20, 60);
  
  // Riscos
  doc.setFontSize(14);
  doc.setTextColor(217, 48, 37);
  doc.text('Riscos Identificados:', 20, 75);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 64, 67);
  let yPosition = 82;
  (report.riscos || []).forEach((risco: string, index: number) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${risco}`, 170);
    doc.text(lines, 25, yPosition);
    yPosition += lines.length * 5 + 2;
  });
  
  // Sugestões
  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(24, 128, 56);
  doc.text('Sugestoes de Melhoria:', 20, yPosition);
  
  yPosition += 7;
  doc.setFontSize(10);
  doc.setTextColor(60, 64, 67);
  (report.sugestoes || []).forEach((sugestao: string, index: number) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${sugestao}`, 170);
    doc.text(lines, 25, yPosition);
    yPosition += lines.length * 5 + 2;
  });
  
  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(112, 117, 122);
  doc.text('Gerado por Audit.AI - Este relatorio e realizado por inteligencia artificial e nao substitui parecer juridico.', 20, 280);
  
  return doc;
}
