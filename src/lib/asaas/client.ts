const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
}

interface AsaasPayment {
  id: string
  customer: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  value: number
  status: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixTransaction?: {
    qrCodeImage: string
    qrCodeText: string
    expirationDate: string
  }
}

interface AsaasApiResponse<T> {
  object: string
  id: string
  data: T[]
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY || '',
  }
}

export async function findOrCreateCustomer(data: {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
}): Promise<AsaasCustomer> {
  try {
    // First try to find by cpfCnpj
    const cleanCpfCnpj = data.cpfCnpj.replace(/\D/g, '')
    
    const searchResponse = await fetch(
      `${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpfCnpj}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    )

    if (!searchResponse.ok) {
      throw new Error(`Failed to search customer: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json() as AsaasApiResponse<AsaasCustomer>

    // If found, return the first customer
    if (searchData.data && searchData.data.length > 0) {
      return searchData.data[0]
    }

    // Not found, create new customer
    const createResponse = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        cpfCnpj: cleanCpfCnpj,
        phone: data.phone,
      }),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      throw new Error(`Failed to create customer: ${JSON.stringify(errorData)}`)
    }

    const newCustomer = await createResponse.json() as AsaasCustomer
    return newCustomer
  } catch (error) {
    console.error('Error in findOrCreateCustomer:', error)
    throw error
  }
}

export async function createPayment(data: {
  customer: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  value: number
  description: string
  externalReference: string
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    phone: string
    postalCode: string
    addressNumber: string
  }
}): Promise<AsaasPayment> {
  try {
    const body: Record<string, unknown> = {
      customer: data.customer,
      billingType: data.billingType,
      value: data.value,
      description: data.description,
      externalReference: data.externalReference,
    }

    // Add credit card info if provided
    if (data.billingType === 'CREDIT_CARD' && data.creditCard) {
      body.creditCard = {
        holderName: data.creditCard.holderName,
        number: data.creditCard.number.replace(/\s/g, ''),
        expiryMonth: data.creditCard.expiryMonth,
        expiryYear: data.creditCard.expiryYear,
        ccv: data.creditCard.ccv,
      }
      
      if (data.creditCardHolderInfo) {
        body.creditCardHolderInfo = {
          name: data.creditCardHolderInfo.name,
          email: data.creditCardHolderInfo.email,
          cpfCnpj: data.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ''),
          phone: data.creditCardHolderInfo.phone,
          postalCode: data.creditCardHolderInfo.postalCode.replace(/\D/g, ''),
          addressNumber: data.creditCardHolderInfo.addressNumber,
        }
      }
    }

    const response = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to create payment: ${JSON.stringify(errorData)}`)
    }

    const payment = await response.json() as AsaasPayment
    return payment
  } catch (error) {
    console.error('Error in createPayment:', error)
    throw error
  }
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  try {
    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to get payment: ${response.status}`)
    }

    const payment = await response.json() as AsaasPayment
    return payment
  } catch (error) {
    console.error('Error in getPayment:', error)
    throw error
  }
}

export async function getPixQrCode(paymentId: string): Promise<{
  encodedImage: string
  payload: string
  expirationDate: string
}> {
  try {
    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to get PIX QR code: ${response.status}`)
    }

    const qrCode = await response.json() as {
      encodedImage: string
      payload: string
      expirationDate: string
    }
    return qrCode
  } catch (error) {
    console.error('Error in getPixQrCode:', error)
    throw error
  }
}

export type { AsaasCustomer, AsaasPayment }
