import os
import json
from datetime import datetime
from pathlib import Path
from io import BytesIO
import google.generativeai as genai
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
import markdown
import re

# Initialize Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

async def generate_campaign_summary(nodes: list, workflow_name: str) -> dict:
    """Generate a comprehensive campaign summary using LLM"""
    
    # Extract agent outputs
    agent_outputs = []
    for node in nodes:
        if node.get("data", {}).get("output"):
            agent_outputs.append({
                "type": node["data"]["agentType"],
                "label": node["data"]["label"],
                "output": node["data"]["output"]
            })
    
    # Create prompt for LLM
    prompt = f"""
You are a marketing campaign analyst. Analyze the following campaign workflow and create a comprehensive executive summary report.

Campaign Name: {workflow_name}
Number of Agents: {len(nodes)}

Agent Outputs:
{json.dumps(agent_outputs, indent=2)}

Please provide a structured analysis with the following sections:

1. EXECUTIVE SUMMARY (2-3 paragraphs)
   - High-level overview of the campaign
   - Key objectives and target audience
   - Main value proposition

2. STRATEGIC INSIGHTS (3-4 key points)
   - Strategic positioning
   - Market opportunities
   - Competitive advantages
   - Brand differentiation

3. CREATIVE EXECUTION (3-4 key points)
   - Messaging strategy
   - Creative approach
   - Visual style and branding
   - Tone and voice

4. MEDIA & DISTRIBUTION (3-4 key points)
   - Channel strategy
   - Media mix recommendations
   - Budget allocation insights
   - Timeline considerations

5. EXPECTED IMPACT & METRICS (4-5 key points)
   - Anticipated reach and engagement
   - Key performance indicators (KPIs)
   - Success metrics
   - ROI expectations
   - Potential risks and mitigation

6. KEY RECOMMENDATIONS (3-4 actionable items)
   - Next steps
   - Implementation priorities
   - Optimization opportunities

Please format your response as a JSON object with these sections as keys. Each section should have:
- "title": section title
- "content": array of key points or paragraphs

Make it professional, data-driven, and actionable.
"""
    
    try:
        # Use Gemini 2.0 Flash for better performance and compatibility
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(prompt)
        
        # Parse the response
        response_text = response.text.strip()
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            summary_data = json.loads(json_match.group())
        else:
            # Fallback: create structured data from text
            summary_data = {
                "executive_summary": {
                    "title": "Executive Summary",
                    "content": [response_text[:500]]
                },
                "full_text": response_text
            }
        
        # Add metadata
        summary_data["metadata"] = {
            "campaign_name": workflow_name,
            "generated_at": datetime.now().isoformat(),
            "total_agents": len(nodes),
            "agent_types": list(set([n["data"]["agentType"] for n in nodes if "data" in n]))
        }
        
        return summary_data
        
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        # Return a basic fallback summary
        return {
            "executive_summary": {
                "title": "Executive Summary",
                "content": [
                    f"Campaign '{workflow_name}' consists of {len(nodes)} agents working in coordination.",
                    "This automated campaign leverages AI-powered strategy, copywriting, visual design, research, and media planning.",
                    "The integrated workflow ensures consistent messaging and optimized performance across all channels."
                ]
            },
            "metadata": {
                "campaign_name": workflow_name,
                "generated_at": datetime.now().isoformat(),
                "total_agents": len(nodes),
                "agent_types": list(set([n["data"]["agentType"] for n in nodes if "data" in n]))
            }
        }


def format_output_for_pdf(output: dict, agent_type: str) -> str:
    """Format agent output for PDF display - converts JSON to readable text"""
    
    def clean_text(text) -> str:
        """Remove markdown and clean unicode characters"""
        if not text:
            return ""
        # Convert to string if it's a dict or other type
        if isinstance(text, dict):
            # Try to extract meaningful text from dict
            text = str(text.get('description', text.get('value', str(text))))
        elif not isinstance(text, str):
            text = str(text)
        # Remove markdown bold/italic
        text = text.replace("", "").replace("*", "")
        # Handle unicode escapes (emojis, etc)
        text = text.encode('latin-1', 'ignore').decode('latin-1')
        return text[:250]  # Limit length
    
    if agent_type == "strategy":
        parts = []
        if output.get("core_concept"):
            parts.append(f"<b>Core Concept:</b> {clean_text(output.get('core_concept'))}")
        if output.get("tagline"):
            parts.append(f"<b>Tagline:</b> {clean_text(output.get('tagline'))}")
        if output.get("target_audience"):
            parts.append(f"<b>Target Audience:</b> {clean_text(output.get('target_audience'))}")
        if output.get("key_messages"):
            messages = output.get("key_messages", [])
            if isinstance(messages, list) and len(messages) > 0:
                msg_text = ', '.join([clean_text(m) for m in messages[:3]])
                parts.append(f"<b>Key Messages:</b> {msg_text}")
        if output.get("tone"):
            parts.append(f"<b>Tone:</b> {clean_text(output.get('tone'))}")
        return "<br/><br/>".join(parts)
    
    elif agent_type == "copywriting":
        parts = []
        if output.get("captions"):
            captions = output.get("captions", [])
            if isinstance(captions, list) and len(captions) > 0:
                caption = clean_text(captions[0])
                parts.append(f"<b>Sample Caption:</b> {caption}")
        if output.get("cta"):
            parts.append(f"<b>Call to Action:</b> {clean_text(output.get('cta'))}")
        if output.get("hashtags"):
            parts.append(f"<b>Hashtags:</b> {clean_text(output.get('hashtags'))}")
        return "<br/><br/>".join(parts)
    
    elif agent_type == "research":
        parts = []
        if output.get("trends"):
            trends = output.get("trends", [])
            if isinstance(trends, list):
                parts.append(f"<b>Key Trends:</b>")
                for i, trend in enumerate(trends[:3], 1):
                    clean_trend = clean_text(str(trend))
                    parts.append(f"  {i}. {clean_trend}")
        
        if output.get("audience_insights"):
            insight = clean_text(str(output.get("audience_insights")))
            parts.append(f"<b>Audience Insights:</b> {insight}")
        
        if output.get("competitive_landscape"):
            landscape = clean_text(str(output.get("competitive_landscape")))
            parts.append(f"<b>Competitive Landscape:</b> {landscape}")
        
        if output.get("opportunities"):
            opps = output.get("opportunities", [])
            if isinstance(opps, list) and len(opps) > 0:
                opp_text = ', '.join([clean_text(o) for o in opps[:2]])
                parts.append(f"<b>Opportunities:</b> {opp_text}")
        
        return "<br/><br/>".join(parts)
    
    elif agent_type == "media":
        parts = []
        if output.get("schedule"):
            schedule = output.get("schedule", [])
            if isinstance(schedule, list):
                parts.append(f"<b>Scheduled Posts:</b> {len(schedule)} posts planned")
                if len(schedule) > 0:
                    first_post = schedule[0]
                    if isinstance(first_post, dict):
                        date = first_post.get("date", "")
                        platform = first_post.get("platform", "")
                        parts.append(f"  First post: {date} on {platform}")
        
        if output.get("budget"):
            budget = output.get("budget")
            if isinstance(budget, dict):
                total = budget.get("total", "N/A")
                parts.append(f"<b>Total Budget:</b> {total}")
            else:
                parts.append(f"<b>Budget:</b> {clean_text(str(budget))}")
        
        if output.get("platforms"):
            platforms = output.get("platforms", [])
            if isinstance(platforms, list):
                parts.append(f"<b>Platforms:</b> {', '.join(platforms[:5])}")
        
        return "<br/><br/>".join(parts)
    
    elif agent_type == "influencer":
        parts = []
        if output.get("influencers"):
            influencers = output.get("influencers", [])
            if isinstance(influencers, list):
                parts.append(f"<b>Influencers Found:</b> {len(influencers)} recommendations")
                # Show details of first 2 influencers
                for i, inf in enumerate(influencers[:2], 1):
                    if isinstance(inf, dict):
                        name = clean_text(inf.get("name", "N/A"))
                        platform = inf.get("platform", "N/A")
                        followers = inf.get("followers", "N/A")
                        engagement = inf.get("engagement_rate", "N/A")
                        parts.append(f"  {i}. {name} ({platform}) - {followers} followers, {engagement} engagement")
        
        if output.get("search_method"):
            parts.append(f"<b>Search Method:</b> {output.get('search_method')}")
        
        if output.get("recommendations"):
            rec = clean_text(str(output.get("recommendations")))
            parts.append(f"<b>Recommendations:</b> {rec}")
        
        return "<br/><br/>".join(parts)
    
    else:
        # Generic formatting for unknown agent types
        parts = []
        for key, value in list(output.items())[:5]:  # First 5 items
            if isinstance(value, (str, int, float)):
                clean_value = clean_text(str(value))
                parts.append(f"<b>{key.replace('_', ' ').title()}:</b> {clean_value}")
            elif isinstance(value, list) and len(value) > 0:
                first_item = clean_text(str(value[0]))
                parts.append(f"<b>{key.replace('_', ' ').title()}:</b> {first_item}...")
        return "<br/><br/>".join(parts)


def create_pdf_report(summary: dict, nodes: list, workflow_name: str) -> Path:
    """Create an attractive PDF report"""
    
    # Ensure reports directory exists
    reports_dir = Path("storage/reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"campaign_report_{timestamp}.pdf"
    filepath = reports_dir / filename
    
    # Create PDF
    doc = SimpleDocTemplate(
        str(filepath),
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1*inch,
        bottomMargin=0.75*inch
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#ADF82D'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#666666'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#ADF82D'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold',
        borderWidth=2,
        borderColor=colors.HexColor('#ADF82D'),
        borderPadding=8,
        backColor=colors.HexColor('#F0F0F0')
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        leading=16
    )
    
    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#444444'),
        spaceAfter=8,
        leftIndent=20,
        bulletIndent=10,
        leading=14
    )
    
    # Header with logo/title
    elements.append(Paragraph(f"CAMPAIGN REPORT", title_style))
    elements.append(Paragraph(f"{workflow_name}", subtitle_style))
    
    # Metadata table
    metadata = summary.get("metadata", {})
    metadata_data = [
        ["Generated:", datetime.now().strftime("%B %d, %Y at %I:%M %p")],
        ["Total Agents:", str(metadata.get("total_agents", len(nodes)))],
        ["Agent Types:", ", ".join(metadata.get("agent_types", []))],
    ]
    
    metadata_table = Table(metadata_data, colWidths=[1.5*inch, 4.5*inch])
    metadata_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F5F5F5')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ]))
    
    elements.append(metadata_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Add sections from summary
    sections = [
        ("executive_summary", "EXECUTIVE SUMMARY"),
        ("strategic_insights", "STRATEGIC INSIGHTS"),
        ("creative_execution", "CREATIVE EXECUTION"),
        ("media_distribution", "MEDIA & DISTRIBUTION"),
        ("expected_impact", "EXPECTED IMPACT & METRICS"),
        ("recommendations", "KEY RECOMMENDATIONS")
    ]
    
    for section_key, section_title in sections:
        section_data = summary.get(section_key, summary.get(section_key.replace('_', ' ').title()))
        
        if section_data:
            # Add section heading
            elements.append(Paragraph(section_title, heading_style))
            
            # Add section content
            if isinstance(section_data, dict):
                content = section_data.get("content", [])
            elif isinstance(section_data, list):
                content = section_data
            else:
                content = [str(section_data)]
            
            for item in content:
                if isinstance(item, str):
                    # Add bullet point
                    elements.append(Paragraph(f"• {item}", bullet_style))
                elif isinstance(item, dict):
                    # Handle nested structure
                    for key, value in item.items():
                        elements.append(Paragraph(f"<b>{key}:</b> {value}", body_style))
            
            elements.append(Spacer(1, 0.2*inch))
    
    # Add agent details section
    elements.append(PageBreak())
    elements.append(Paragraph("AGENT WORKFLOW DETAILS", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    for idx, node in enumerate(nodes, 1):
        data = node.get("data", {})
        agent_type = data.get("agentType", "Unknown")
        label = data.get("label", "Unnamed Agent")
        output = data.get("output", "No output")
        
        # Agent card header
        agent_data = [[Paragraph(f"<b>{idx}. {label}</b>", body_style)]]
        agent_data.append([Paragraph(f"<i>Type: {agent_type.title()}</i>", body_style)])
        
        # Format output based on agent type
        if isinstance(output, dict):
            if output.get("type") == "visual_with_images":
                # Visual agent - show style and image count
                style = output.get("style", "N/A")
                image_count = len(output.get("images", []))
                agent_data.append([Paragraph(f"<b>Visual Style:</b> {style}", body_style)])
                agent_data.append([Paragraph(f"<b>Images Generated:</b> {image_count}", body_style)])
                
                if output.get("color_palette"):
                    colors_text = ", ".join(output.get("color_palette", []))
                    agent_data.append([Paragraph(f"<b>Color Palette:</b> {colors_text}", body_style)])
                    
            else:
                # Format other agent outputs nicely
                output_text = format_output_for_pdf(output, agent_type)
                agent_data.append([Paragraph(output_text, body_style)])
        else:
            # Plain text output
            output_str = str(output)[:500]
            if len(str(output)) > 500:
                output_str += "..."
            agent_data.append([Paragraph(output_str, body_style)])
        
        agent_table = Table(agent_data, colWidths=[6*inch])
        agent_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ADF82D')),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAFAFA')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#DDDDDD')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        elements.append(agent_table)
        elements.append(Spacer(1, 0.15*inch))
    
    # Footer with branding
    elements.append(Spacer(1, 0.3*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#999999'),
        alignment=TA_CENTER
    )
    elements.append(Paragraph("Generated by BrandMind AI Campaign Generator", footer_style))
    elements.append(Paragraph("Powered by Multi-Agent Workflow System", footer_style))
    
    # Build PDF
    doc.build(elements)
    
    return filepath