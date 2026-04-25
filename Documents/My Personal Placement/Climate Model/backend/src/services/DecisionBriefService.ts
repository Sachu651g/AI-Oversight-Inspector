import axios from 'axios';
import logger from '../config/logger';
import redis from '../config/redis';

export interface DecisionBrief {
  brief: string;
  confidenceScore: number;
  language: string;
  timestamp: Date;
  riskData: any;
}

export class DecisionBriefService {
  private claudeApiKey: string;
  private claudeModel: string;
  private maxTokens: number;

  constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY || '';
    this.claudeModel = process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '1024');
  }

  /**
   * Generate AI-powered decision brief using Claude API
   */
  async generateBrief(
    riskData: {
      zoneName: string;
      riskLevel: string;
      affectedPopulation: number;
      weatherSummary: string;
    },
    language: string = 'English'
  ): Promise<DecisionBrief> {
    try {
      // Check cache first
      const cacheKey = `brief:${riskData.zoneName}:${riskData.riskLevel}:${language}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Decision brief retrieved from cache');
        return cached;
      }

      let brief: string;
      let confidenceScore: number;

      // Try Claude API first
      if (this.claudeApiKey) {
        try {
          const claudeResponse = await this.callClaudeAPI(riskData, language);
          brief = claudeResponse.brief;
          confidenceScore = claudeResponse.confidence;
        } catch (error) {
          logger.warn('Claude API failed, using template fallback:', error);
          const fallback = this.generateTemplateBrief(riskData, language);
          brief = fallback.brief;
          confidenceScore = fallback.confidence;
        }
      } else {
        // No API key, use template
        logger.info('No Claude API key, using template brief');
        const fallback = this.generateTemplateBrief(riskData, language);
        brief = fallback.brief;
        confidenceScore = fallback.confidence;
      }

      const decisionBrief: DecisionBrief = {
        brief,
        confidenceScore,
        language,
        timestamp: new Date(),
        riskData,
      };

      // Cache for 10 minutes
      await this.saveToCache(cacheKey, decisionBrief, 600);

      logger.info(`Decision brief generated for ${riskData.zoneName}`);
      return decisionBrief;
    } catch (error) {
      logger.error('Decision brief generation failed:', error);
      throw error;
    }
  }

  /**
   * Call Claude API
   */
  private async callClaudeAPI(
    riskData: any,
    language: string
  ): Promise<{ brief: string; confidence: number }> {
    const prompt = this.buildPrompt(riskData, language);

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.claudeModel,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    const brief = response.data.content[0].text;
    const confidence = this.calculateConfidence(riskData);

    return { brief, confidence };
  }

  /**
   * Build prompt for Claude API
   */
  private buildPrompt(riskData: any, language: string): string {
    return `You are an emergency management AI assistant for Climate Guardian. Generate a concise, actionable decision brief for disaster response.

Situation:
- Zone: ${riskData.zoneName}
- Risk Level: ${riskData.riskLevel}
- Affected Population: ${riskData.affectedPopulation}
- Weather: ${riskData.weatherSummary}

Generate a decision brief in ${language} with:
1. Situation summary (2-3 sentences)
2. Immediate actions (3-5 bullet points)
3. Hospital pre-positioning checklist (3 items)
4. Evacuation priority ranking (High/Medium/Low zones)
5. Estimated impact window (hours)

Keep it concise, actionable, and urgent. Use clear language suitable for emergency coordinators.`;
  }

  /**
   * Generate template-based fallback brief
   */
  private generateTemplateBrief(
    riskData: any,
    language: string
  ): { brief: string; confidence: number } {
    const templates: Record<string, string> = {
      Critical: `🚨 CRITICAL ALERT - ${riskData.zoneName}

SITUATION:
Critical disaster risk detected in ${riskData.zoneName}. Approximately ${riskData.affectedPopulation} people at immediate risk. ${riskData.weatherSummary}

IMMEDIATE ACTIONS:
• Initiate immediate evacuation of all residents
• Activate emergency response teams and disaster management protocols
• Deploy rescue and medical teams to high-risk areas
• Establish emergency shelters and relief centers
• Issue public alerts via SMS, radio, and sirens

HOSPITAL PRE-POSITIONING:
• Pre-position ambulances at evacuation routes
• Prepare emergency beds and medical supplies
• Alert trauma teams and emergency staff
• Coordinate with nearby hospitals for overflow capacity

EVACUATION PRIORITY:
1. HIGH: Low-lying areas, elderly care facilities, schools
2. MEDIUM: Residential zones near water bodies
3. LOW: Elevated areas with strong infrastructure

IMPACT WINDOW: 0-6 hours - Act immediately

STATUS: EMERGENCY RESPONSE ACTIVATED`,

      High: `⚠️ HIGH RISK ALERT - ${riskData.zoneName}

SITUATION:
High disaster risk in ${riskData.zoneName}. Estimated ${riskData.affectedPopulation} people affected. ${riskData.weatherSummary}

IMMEDIATE ACTIONS:
• Issue evacuation advisory for vulnerable zones
• Pre-position emergency response teams
• Activate emergency shelters and relief supplies
• Monitor situation closely for escalation
• Prepare evacuation routes and transportation

HOSPITAL PRE-POSITIONING:
• Alert emergency departments
• Prepare additional beds and supplies
• Brief medical staff on disaster protocols

EVACUATION PRIORITY:
1. HIGH: Vulnerable populations (elderly, disabled, children)
2. MEDIUM: Low-lying residential areas
3. LOW: Elevated commercial zones

IMPACT WINDOW: 6-12 hours - Prepare for evacuation

STATUS: ADVISORY ISSUED`,

      Medium: `⚡ MEDIUM RISK ADVISORY - ${riskData.zoneName}

SITUATION:
Moderate disaster risk in ${riskData.zoneName}. Approximately ${riskData.affectedPopulation} people may be affected. ${riskData.weatherSummary}

IMMEDIATE ACTIONS:
• Issue public advisory and safety guidelines
• Monitor weather and risk parameters closely
• Prepare evacuation plans and resources
• Alert emergency services to standby
• Inform vulnerable populations

HOSPITAL PRE-POSITIONING:
• Brief emergency staff on potential scenarios
• Review disaster response protocols
• Ensure adequate supplies available

EVACUATION PRIORITY:
1. HIGH: Vulnerable populations in flood-prone areas
2. MEDIUM: Residents near water bodies
3. LOW: General population (monitor situation)

IMPACT WINDOW: 12-24 hours - Monitor and prepare

STATUS: ADVISORY ACTIVE`,

      Low: `ℹ️ LOW RISK NOTICE - ${riskData.zoneName}

SITUATION:
Low disaster risk in ${riskData.zoneName}. Minimal impact expected. ${riskData.weatherSummary}

IMMEDIATE ACTIONS:
• Continue normal operations with monitoring
• Issue weather advisory to residents
• Maintain readiness of emergency services
• Monitor parameter trends for changes

HOSPITAL PRE-POSITIONING:
• Normal operations continue
• Emergency services on standard alert

EVACUATION PRIORITY:
No evacuation required at this time

IMPACT WINDOW: 24+ hours - Continue monitoring

STATUS: NORMAL OPERATIONS`,
    };

    const brief = templates[riskData.riskLevel] || templates['Low'];
    const confidence = 60; // Lower confidence for template-based briefs

    return { brief, confidence };
  }

  /**
   * Calculate confidence score based on risk data
   */
  private calculateConfidence(riskData: any): number {
    let confidence = 85; // Base confidence for Claude API

    // Reduce confidence if risk level is borderline
    if (riskData.riskLevel === 'Medium') confidence -= 10;

    // Increase confidence if population data is accurate
    if (riskData.affectedPopulation > 0) confidence += 5;

    return Math.min(Math.max(confidence, 60), 95);
  }

  /**
   * Cache management
   */
  private async getFromCache(key: string): Promise<DecisionBrief | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async saveToCache(key: string, data: DecisionBrief, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache save failed:', error);
    }
  }
}
