import { createClient } from '@/lib/api/shared/supabase-client'
import type {
  Attachment,
  AttachmentInsert,
  EntityType
} from '@/lib/types/database'

export async function getAttachments(entityId: string, entityType: EntityType) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .order('upload_date', { ascending: false })
  if (error) throw error
  return data as Attachment[]
}

export async function getAttachmentsByEntityType(entityType: EntityType) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('entity_type', entityType)
    .order('upload_date', { ascending: false })
  if (error) throw error
  return data as Attachment[]
}

export async function uploadAttachment(
  file: File,
  entityId: string,
  entityType: EntityType
) {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${entityType}/${entityId}/${Math.random().toString(36).substring(7)}.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(fileName, file)
  
  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`)
  }
  
  const { data: publicUrlData } = supabase.storage
    .from('attachments')
    .getPublicUrl(fileName)
  
  const attachmentData: AttachmentInsert = {
    entity_type: entityType,
    entity_id: entityId,
    file_name: file.name,
    file_path: fileName,
    file_type: file.type,
    file_size: file.size,
    ocr_text: null,
    uploaded_by: null,
  }
  
  const { data, error } = await supabase
    .from('attachments')
    .insert(attachmentData)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to save attachment record: ${error.message}`)
  }
  
  return data as Attachment
}

export async function deleteAttachment(id: string, filePath: string) {
  const supabase = createClient()
  
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([filePath])
  
  if (storageError) {
    console.error('Error deleting file from storage:', storageError)
  }
  
  const { error } = await supabase
    .from('attachments')
    .delete()
    .eq('id', id)
  
  if (error) {
    throw new Error(`Failed to delete attachment record: ${error.message}`)
  }
}

export async function searchAttachments(query: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('search_attachments', {
    search_query: query,
    limit_val: 10
  })
  
  if (error) throw error
  return data || []
}
