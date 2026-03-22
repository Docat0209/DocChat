-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Documents: users can CRUD their own documents
CREATE POLICY "Users can read own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Document chunks: access via document ownership
CREATE POLICY "Users can read own document chunks"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_chunks.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own document chunks"
  ON document_chunks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_chunks.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own document chunks"
  ON document_chunks FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_chunks.document_id
    AND documents.user_id = auth.uid()
  ));

-- Chats: users can CRUD their own chats
CREATE POLICY "Users can read own chats"
  ON chats FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chats"
  ON chats FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Messages: access via chat ownership
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND chats.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND chats.user_id = auth.uid()
  ));
