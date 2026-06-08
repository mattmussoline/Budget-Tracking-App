import type {
  AudienceOption,
  ContractStatusOption,
  FormatOption,
  GenreOption,
  ProviderOption,
  ReviewStageOption
} from "./content-review-options";

export type ContentReviewItem = {
  id: string;
  title: string;
  provider: ProviderOption;
  genre: GenreOption;
  format: FormatOption;
  reviewStage: ReviewStageOption;
  contractStatus: ContractStatusOption;
  audience: AudienceOption;
  releaseDate: string;
  notes: string;
  summary: string;
};
