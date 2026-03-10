declare module "sentiment" {
  interface SentimentResult {
    score: number;
    comparative: number;
    calculation: Array<Record<string, number>>;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  interface SentimentOptions {
    extras?: Record<string, number>;
    language?: string;
  }

  class Sentiment {
    analyze(phrase: string, opts?: SentimentOptions): SentimentResult;
    registerLanguage(languageCode: string, language: unknown): void;
  }

  export default Sentiment;
}
