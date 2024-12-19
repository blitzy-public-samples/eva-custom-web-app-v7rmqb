import { FC, useState, useMemo, ChangeEvent } from 'react';
import Card from '@/components/common/Card/Card';
import { TextField, MenuItem, Paper, Typography, Box, Container } from '@mui/material';

interface HelpSection {
  title: string;
  content: string;
  categories: string[];
}

const helpSections: HelpSection[] = [
  {
    title: 'Getting Started Guide',
    content: `Our platform helps you manage documents securely and efficiently. Here's what you can do:
    • Upload and organize documents
    • Share files securely
    • Manage delegate access
    • Configure account settings`,
    categories: ['basics', 'general']
  },
  {
    title: 'Document Management',
    content: `Learn about our document management features:
    • Secure document upload
    • File organization and tagging
    • Version control
    • Document sharing and permissions
    • Batch operations`,
    categories: ['documents', 'security']
  },
  {
    title: 'Delegate Access Control',
    content: `Manage delegate access to your account:
    • Add and remove delegates
    • Set permission levels
    • Time-limited access
    • Activity monitoring
    • Revocation procedures`,
    categories: ['security', 'delegates']
  },
  {
    title: 'Security & Settings',
    content: `Configure your security preferences:
    • Two-factor authentication
    • Login history
    • Notification preferences
    • Password management
    • Account recovery options`,
    categories: ['security', 'settings']
  },
  {
    title: 'Support & Contact',
    content: `Need additional help? Our support team is here for you:
    • Email: support@example.com
    • Phone: 1-800-HELP-NOW
    • Live Chat: Available 24/7
    • Knowledge Base: help.example.com`,
    categories: ['support', 'contact']
  }
];

const Help: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    helpSections.forEach(section => {
      section.categories.forEach(cat => cats.add(cat));
    });
    return ['all', ...Array.from(cats)];
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedCategory(e.target.value);
  };

  const filteredSections = useMemo(() => {
    return helpSections.filter(section => {
      const matchesSearch = 
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        section.categories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        {/* Header Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'var(--primary-color)', 
            color: 'var(--primary-color-contrast)',
            py: 6,
            px: 4,
            mb: 6,
            borderRadius: 2,
            textAlign: 'center',
            border: '1px solid black'
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            Help Center
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Find answers to common questions and learn how to use our platform
          </Typography>

          {/* Search Section */}
          <Box sx={{ 
            maxWidth: 800, 
            mx: 'auto',
            display: 'flex',
            gap: 2,
            px: 2,
            py: 3,
            bgcolor: 'background.paper',
            borderRadius: 1,
          }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={handleSearchChange}
              size="small"
              sx={{ bgcolor: 'background.paper' }}
            />
            <TextField
              select
              value={selectedCategory}
              onChange={handleCategoryChange}
              variant="outlined"
              size="small"
              sx={{ 
                minWidth: 200,
                bgcolor: 'background.paper',
                padding: 0,
                '& .css-w188iy-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input.MuiSelect-select': {
                  minHeight: 'auto'
                }
              }}
            >
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {/* Content Grid */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { md: '1fr 1fr' }, 
          gap: 3 
        }}>
          {filteredSections.map((section, index) => (
            <Card
              key={index}
              title={section.title}
              subtitle={section.content}
              className="hover:shadow-lg transition-shadow duration-300"
            >
              <Box sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                  mt: 2 
                }}>
                  {section.categories.map(category => (
                    <Typography
                      key={category}
                      component="span"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: 'grey.100',
                        color: 'grey.700',
                        borderRadius: 10,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {category}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>

        {/* Empty State */}
        {filteredSections.length === 0 && (
          <Paper 
            sx={{ 
              textAlign: 'center', 
              py: 6,
              px: 3,
              mt: 4,
              bgcolor: 'grey.50'
            }}
          >
            <Typography variant="h6" gutterBottom>
              No results found
            </Typography>
            <Typography color="text.secondary">
              Try adjusting your search or category filter
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default Help; 