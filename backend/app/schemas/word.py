from pydantic import BaseModel, Field


class ProgressResponse(BaseModel):
    id: str
    masteryLevel: int
    reviewCount: int
    wrongCount: int
    isFavorite: bool
    lastReviewTime: str | None
    nextReviewTime: str | None


class WordResponse(BaseModel):
    id: str
    word: str
    phonetic: str | None
    meaning: str
    partOfSpeech: str | None
    level: str
    frequency: int
    example: str | None
    exampleCn: str | None
    tags: list[str]
    progress: ProgressResponse | None


class PaginationResponse(BaseModel):
    page: int
    limit: int
    total: int | None
    totalPages: int | None


class WordsResponse(BaseModel):
    words: list[WordResponse]
    pagination: PaginationResponse


class ProgressUpdateRequest(BaseModel):
    masteryLevel: int = Field(ge=0, le=5)


class ReviewRequest(BaseModel):
    result: str = Field(pattern="^(correct|wrong|skip)$")
    reviewType: str = "recognition"


class ProgressEnvelope(BaseModel):
    progress: ProgressResponse


class FavoriteEnvelope(BaseModel):
    isFavorite: bool
    progress: ProgressResponse
