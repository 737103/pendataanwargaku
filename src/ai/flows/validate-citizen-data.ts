
'use server';

/**
 * @fileOverview A citizen data validation AI agent.
 *
 * - validateCitizenData - A function that handles the citizen data validation process.
 * - ValidateCitizenDataInput - The input type for the validateCitizenData function.
 * - ValidateCitizenDataOutput - The return type for the validateCitizenData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateCitizenDataInputSchema = z.object({
  name: z.string().describe('The name of the citizen.'),
  address: z.string().describe('The address of the citizen.'),
  contactInfo: z.string().describe('The contact information of the citizen.'),
  documents: z.array(z.string()).describe('A list of document URLs of the citizen.'),
  nik: z.string().describe('The National Identity Number (NIK) of the citizen.'),
  kkNumber: z.string().describe('The Family Card Number (No. KK) of the citizen.'),
  bloodType: z.string().describe('The blood type of the citizen.'),
  rt: z.string().describe('The RT of the citizen.'),
  rw: z.string().describe('The RW of the citizen.'),
});
export type ValidateCitizenDataInput = z.infer<typeof ValidateCitizenDataInputSchema>;

const ValidateCitizenDataOutputSchema = z.object({
  isValid: z.boolean().describe('Whether or not the citizen data is valid.'),
  validationErrors: z.array(z.string()).describe('A list of validation errors, if any.'),
});
export type ValidateCitizenDataOutput = z.infer<typeof ValidateCitizenDataOutputSchema>;

export async function validateCitizenData(input: ValidateCitizenDataInput): Promise<ValidateCitizenDataOutput> {
  return validateCitizenDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateCitizenDataPrompt',
  input: {schema: ValidateCitizenDataInputSchema},
  output: {schema: ValidateCitizenDataOutputSchema},
  prompt: `Anda adalah asisten AI yang berspesialisasi dalam memvalidasi data warga untuk akurasi dan kelengkapan. Tinjau data warga yang diberikan dan identifikasi potensi kesalahan atau inkonsistensi. Berikan semua pesan kesalahan dalam Bahasa Indonesia.

Nama Warga: {{{name}}}
NIK: {{{nik}}}
No. KK: {{{kkNumber}}}
Alamat Warga: {{{address}}}
RT/RW: {{{rt}}}/{{{rw}}}
Info Kontak Warga: {{{contactInfo}}}
Dokumen Warga: {{{documents}}}
Golongan Darah: {{{bloodType}}}

Tentukan apakah data yang diberikan valid dan berikan daftar kesalahan validasi jika ada. Kembalikan isValid sebagai false jika ada kesalahan. Pastikan NIK dan No. KK memiliki 16 digit.
`,
});

const validateCitizenDataFlow = ai.defineFlow(
  {
    name: 'validateCitizenDataFlow',
    inputSchema: ValidateCitizenDataInputSchema,
    outputSchema: ValidateCitizenDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
