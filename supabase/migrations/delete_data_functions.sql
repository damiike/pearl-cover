-- Delete all user data function
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    deleted_counts json;
BEGIN
    -- Only allow admins or the user themselves
    IF auth.uid() != target_user_id AND 
       (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('admin', 'owner') THEN
        RAISE EXCEPTION 'Unauthorized: Only admins/owners can delete other users data';
    END IF;

    -- Delete data in correct order (respecting foreign keys)
    DELETE FROM note_tags WHERE note_id IN (SELECT id FROM notes WHERE created_by = target_user_id);
    DELETE FROM note_workcover_claims WHERE note_id IN (SELECT id FROM notes WHERE created_by = target_user_id);
    DELETE FROM note_aged_care_expenses WHERE note_id IN (SELECT id FROM notes WHERE created_by = target_user_id);
    DELETE FROM note_workcover_expenses WHERE note_id IN (SELECT id FROM notes WHERE created_by = target_user_id);
    DELETE FROM notes WHERE created_by = target_user_id;
    
    DELETE FROM event_tags WHERE event_id IN (SELECT id FROM calendar_events WHERE created_by = target_user_id);
    DELETE FROM calendar_events WHERE created_by = target_user_id;
    
    DELETE FROM attachments WHERE uploaded_by = target_user_id;
    DELETE FROM workcover_expenses WHERE created_by = target_user_id;
    DELETE FROM aged_care_expenses WHERE created_by = target_user_id;
    DELETE FROM workcover_claims WHERE created_by = target_user_id;
    DELETE FROM payment_transactions WHERE created_by = target_user_id;
    DELETE FROM funding_allocations WHERE created_by = target_user_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'user_id', target_user_id,
        'message', 'All user data deleted successfully'
    );
END;
$$;

-- Delete ALL system data (admin only)
CREATE OR REPLACE FUNCTION delete_all_system_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow admins
    IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete all system data';
    END IF;

    -- Delete all data from all tables
    TRUNCATE note_tags, note_workcover_claims, note_aged_care_expenses, note_workcover_expenses CASCADE;
    TRUNCATE notes CASCADE;
    TRUNCATE event_tags CASCADE;
    TRUNCATE calendar_events CASCADE;
    TRUNCATE attachments CASCADE;
    TRUNCATE workcover_expenses CASCADE;
    TRUNCATE aged_care_expenses CASCADE;
    TRUNCATE workcover_claims CASCADE;
    TRUNCATE payment_transactions CASCADE;
    TRUNCATE funding_allocations CASCADE;
    TRUNCATE audit_logs CASCADE;
    
    RETURN json_build_object(
        'success', true,
        'message', 'All system data deleted successfully'
    );
END;
$$;
