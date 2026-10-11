import { Injectable, Logger } from '@nestjs/common';
import { AiPort } from './ai.port';
import {
  AiDatePlanProposalDto,
  AiDateRecommendationDto,
  AiRelationshipInsightDto,
} from '@ours/contracts';

@Injectable()
export class GeminiAdapter implements AiPort {
  private readonly logger = new Logger(GeminiAdapter.name);
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  private async callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nStrict output: Return ONLY raw, valid JSON with no markdown backticks, no code fence, no conversational prelude.\n\nUser request: ${userPrompt}`,
                },
              ],
            },
          ],
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const safeError = this.apiKey ? errorText.replace(new RegExp(this.apiKey, 'g'), '[REDACTED]') : errorText;
        throw new Error(`Gemini HTTP ${response.status}: ${safeError}`);
      }

      const data: any = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty Gemini response parts');
      }

      return rawText;
    } catch (err: any) {
      clearTimeout(timeout);
      const rawMsg = err?.message || 'Unknown error';
      const safeMsg = this.apiKey ? rawMsg.replace(new RegExp(this.apiKey, 'g'), '[REDACTED]') : rawMsg;
      this.logger.warn(`Gemini API call failed (${safeMsg}). Using deterministic fallback.`);
      throw new Error(`Gemini call error: ${safeMsg}`);
    }
  }

  async generatePlanProposal(
    prompt: string,
    budgetMinorUnits?: number,
    category?: string,
  ): Promise<AiDatePlanProposalDto> {
    const systemPrompt = `You are an elite romantic date architect for OURS, a private couple lifestyle app.
Design a cohesive, memorable couple date plan based on the user's prompt.
Respond with JSON matching this structure:
{
  "title": string,
  "description": string,
  "suggestedDate": "YYYY-MM-DD",
  "estimatedBudgetMinorUnits": number,
  "stops": [
    {
      "title": string,
      "placeName": string,
      "notes": string,
      "estimatedDurationMin": number
    }
  ],
  "checklist": [string]
}`;

    try {
      const raw = await this.callGemini(systemPrompt, prompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        title: parsed.title || 'Romantic Escape',
        description: parsed.description || 'A thoughtfully curated date itinerary.',
        suggestedDate: parsed.suggestedDate || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        estimatedBudgetMinorUnits: typeof parsed.estimatedBudgetMinorUnits === 'number' ? parsed.estimatedBudgetMinorUnits : (budgetMinorUnits || 6500),
        stops: Array.isArray(parsed.stops) ? parsed.stops : [
          { title: 'Sunset Aperitif', placeName: 'Skyline Terrace', notes: 'Golden hour drinks and conversation', estimatedDurationMin: 60 },
          { title: 'Intimate Dinner', placeName: 'Bistro Lumiere', notes: 'Candlelit 3-course dinner', estimatedDurationMin: 90 },
        ],
        checklist: Array.isArray(parsed.checklist) ? parsed.checklist : ['Confirm reservation', 'Dress smart casual', 'Bring Polaroid camera'],
      };
    } catch {
      // Deterministic fallback
      return {
        title: 'Golden Hour & Intimate Dinner',
        description: `Crafted from prompt: "${prompt}". A calm evening focusing on quiet connection.`,
        suggestedDate: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
        estimatedBudgetMinorUnits: budgetMinorUnits || 6500,
        stops: [
          {
            title: 'Coffee & Stroll',
            placeName: 'Botanical Artisan Roastery',
            notes: 'Handcrafted drinks and peaceful walking trails',
            estimatedDurationMin: 60,
          },
          {
            title: 'Candlelit Bistro',
            placeName: 'Rustic Hearth Kitchen',
            notes: 'Farm-to-table seasonal dinner sharing plates',
            estimatedDurationMin: 90,
          },
        ],
        checklist: ['Charge phone/camera', 'Book outdoor patio table', 'Pick out matching cozy outfits'],
      };
    }
  }

  async generateRecommendations(
    categoryPreferences: string[],
    budgetMinorUnits?: number,
    existingPlaces?: string[],
  ): Promise<AiDateRecommendationDto[]> {
    const systemPrompt = `You are the AI date curator for OURS. Recommend 3 distinct couple date experiences tailored to these preferences.
Respond with JSON matching this structure:
[
  {
    "title": string,
    "category": string,
    "estimatedBudgetMinorUnits": number,
    "description": string,
    "recommendedLocation": string,
    "whyYouWillLoveIt": string
  }
]`;

    const userPrompt = `Categories: ${categoryPreferences.join(', ') || 'Any'}. Budget: ${budgetMinorUnits || 5000} cents. Already visited: ${(existingPlaces || []).join(', ')}`;

    try {
      const raw = await this.callGemini(systemPrompt, userPrompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3);
      }
    } catch {
      // Fallback
    }

    return [
      {
        title: 'Twilight Gallery Walk & Gelato',
        category: 'CULTURE',
        estimatedBudgetMinorUnits: 3000,
        description: 'Explore quiet contemporary evening exhibits followed by handcrafted gelato.',
        recommendedLocation: 'Modern Art Pavillion & Via Dolci',
        whyYouWillLoveIt: 'Inspires deep conversation away from screen noise in a relaxed atmospheric space.',
      },
      {
        title: 'Secret Courtyard Jazz & Wine',
        category: 'DINING',
        estimatedBudgetMinorUnits: 7500,
        description: 'Live acoustic jazz duo with natural wine and artisanal charcuterie boards.',
        recommendedLocation: 'Cellar & Vine Hidden Terrace',
        whyYouWillLoveIt: 'Intimate seating and soft acoustics create effortless romantic chemistry.',
      },
      {
        title: 'Dawn Viewpoint Picnic',
        category: 'NATURE',
        estimatedBudgetMinorUnits: 2500,
        description: 'Watch the sunrise together with a thermos of hot coffee and warm bakery pastries.',
        recommendedLocation: 'Pine Crest Ridge Overlook',
        whyYouWillLoveIt: 'A peaceful shared milestone that starts the weekend with serene gratitude.',
      },
    ];
  }

  async generateRelationshipInsights(stats: {
    daysTogether: number;
    visitsCount: number;
    datesCompletedCount: number;
    topCategory?: string;
  }): Promise<AiRelationshipInsightDto[]> {
    return [
      {
        headline: `${stats.daysTogether} Days of Growing Together`,
        body: 'Every week you create shared milestones that deepen your mutual foundation.',
        metric: `${stats.daysTogether} days`,
        category: 'MILESTONES',
      },
      {
        headline: 'Favorite Shared Rhythms',
        body: stats.topCategory
          ? `Your most cherished experiences center around ${stats.topCategory.toLowerCase()}.`
          : 'You enjoy exploring diverse styles of dates together.',
        metric: stats.topCategory || 'Versatile',
        category: 'EXPLORATION',
      },
      {
        headline: 'Shared Date Momentum',
        body: `You have completed ${stats.datesCompletedCount} intentional dates and logged ${stats.visitsCount} visits.`,
        metric: `${stats.datesCompletedCount} dates`,
        category: 'HABITS',
      },
    ];
  }
}
