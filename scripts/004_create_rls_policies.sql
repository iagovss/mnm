-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Provider profiles policies
CREATE POLICY "Providers can insert their own profile" ON provider_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view provider profiles" ON provider_profiles
  FOR SELECT USING (true);

CREATE POLICY "Providers can update their own profile" ON provider_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Provider categories policies
CREATE POLICY "Providers can insert their own categories" ON provider_categories
  FOR INSERT WITH CHECK (
    auth.uid() = provider_id
  );

CREATE POLICY "Anyone can view provider categories" ON provider_categories
  FOR SELECT USING (true);

CREATE POLICY "Providers can update their own categories" ON provider_categories
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete their own categories" ON provider_categories
  FOR DELETE USING (auth.uid() = provider_id);

-- Service categories policies (read-only for all)
CREATE POLICY "Anyone can view service categories" ON service_categories
  FOR SELECT USING (true);

-- Service requests policies
CREATE POLICY "Clients can insert their own requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can view requests they're involved in" ON service_requests
  FOR SELECT USING (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM proposals 
      WHERE proposals.request_id = service_requests.id 
      AND proposals.provider_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their own requests" ON service_requests
  FOR UPDATE USING (auth.uid() = client_id);

-- Proposals policies
CREATE POLICY "Providers can insert proposals" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can view proposals they're involved in" ON proposals
  FOR SELECT USING (
    auth.uid() = provider_id OR 
    EXISTS (
      SELECT 1 FROM service_requests 
      WHERE service_requests.id = proposals.request_id 
      AND service_requests.client_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their own proposals" ON proposals
  FOR UPDATE USING (auth.uid() = provider_id);

-- Conversations policies
CREATE POLICY "Users can insert conversations they're part of" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = client_id OR auth.uid() = provider_id
  );

CREATE POLICY "Users can view conversations they're part of" ON conversations
  FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = provider_id
  );

-- Messages policies
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.client_id = auth.uid() OR conversations.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.client_id = auth.uid() OR conversations.provider_id = auth.uid())
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Payments policies
CREATE POLICY "Users can view payments they're involved in" ON payments
  FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = provider_id
  );

-- System can manage payments
CREATE POLICY "System can manage payments" ON payments
  FOR ALL USING (true);

-- Reviews policies
CREATE POLICY "Clients can insert reviews for their requests" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Clients can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = client_id);
