export type EventTicketDraft = {
  name: string
  price: string
  serviceFee: string
  quantity: string
  purchaseLimit: string
  salesStart: string
  salesEnd: string
}

export type EventDraft = {
  name: string
  categoryId: string
  categoryName: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  address: string
  coverFile: File | null
  coverPreviewUrl: string
  tags: string[]
  tickets: EventTicketDraft[]
  socialLinks: {
    instagram: string
    facebook: string
    x: string
    linkedin: string
  }
  promotionFile: File | null
  promotionPreviewUrl: string
}
