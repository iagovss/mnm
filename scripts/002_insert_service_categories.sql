-- Insert service categories
INSERT INTO public.service_categories (name, description, icon) VALUES
('Limpeza', 'Serviços de limpeza residencial e comercial', '🧹'),
('Encanamento', 'Reparos e instalações hidráulicas', '🔧'),
('Elétrica', 'Serviços elétricos e instalações', '⚡'),
('Jardinagem', 'Cuidados com jardins e plantas', '🌱'),
('Pintura', 'Pintura residencial e comercial', '🎨'),
('Marcenaria', 'Móveis sob medida e reparos', '🪚'),
('Informática', 'Suporte técnico e reparos', '💻'),
('Aulas Particulares', 'Ensino personalizado', '📚'),
('Cuidado de Pets', 'Pet sitting e cuidados', '🐕'),
('Fotografia', 'Serviços fotográficos', '📸'),
('Culinária', 'Chef particular e catering', '👨‍🍳'),
('Fitness', 'Personal trainer e atividades físicas', '💪')
ON CONFLICT DO NOTHING;
