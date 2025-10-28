"""
Campaign Report Generator - Feature Summary

This module provides comprehensive campaign impact reporting with:
1. AI-powered analysis using Google Gemini
2. Professional PDF generation with ReportLab
3. Beautiful multi-page reports with brand styling
4. Strategic insights and actionable recommendations

Key Functions:
- generate_campaign_summary(): Analyzes workflow data with LLM
- create_pdf_report(): Generates professional PDF with custom styling

Report Sections:
- Executive Summary
- Strategic Insights
- Creative Execution
- Media & Distribution
- Expected Impact & Metrics
- Key Recommendations
- Agent Workflow Details

Usage:
    from tools.report_generator import generate_campaign_summary, create_pdf_report
    
    summary = await generate_campaign_summary(nodes, "My Campaign")
    pdf_path = create_pdf_report(summary, nodes, "My Campaign")

Dependencies:
- reportlab>=4.0.0 (PDF generation)
- markdown>=3.5.0 (text formatting)
- google-generativeai (AI analysis)

Output:
- JSON summary with structured analysis
- Multi-page PDF report (storage/reports/)
- Downloadable via /api/download-report/{filename}
"""
