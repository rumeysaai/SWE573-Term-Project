import React, { useCallback, useEffect, useState } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import api from '../api';

const TagSelector = ({ value, onChange, placeholder = "Search or create tags...", isMulti = true, isDisabled = false, showAllTagsOnOpen = false }) => {
  const [defaultOptions, setDefaultOptions] = useState([]);

  // Load all tags when component mounts if showAllTagsOnOpen is true
  useEffect(() => {
    if (showAllTagsOnOpen) {
      const loadAllTags = async () => {
        try {
          const response = await api.get('/tags/');
          let allTagsData = [];
          if (Array.isArray(response.data)) {
            allTagsData = response.data;
          } else if (response.data && typeof response.data === 'object') {
            allTagsData = response.data.results || [];
          }
          
          const formattedTags = allTagsData.map(tag => ({
            value: tag.id ? Number(tag.id) : `custom_${tag.name}`,
            label: tag.label || tag.name,
            name: tag.name,
            wikidata_id: tag.wikidata_id,
            description: tag.description,
            is_custom: tag.is_custom || !tag.id,
            source: 'local'
          }));
          
          setDefaultOptions(formattedTags);
          console.log('TagSelector: Loaded', formattedTags.length, 'tags as default options');
        } catch (error) {
          console.error('TagSelector: Error loading all tags:', error);
        }
      };
      loadAllTags();
    }
  }, [showAllTagsOnOpen]);

  const loadOptions = useCallback(async (inputValue) => {
    // If input is empty, return empty array (don't show anything until user types)
    // User needs to type at least 2 characters to trigger search
    const query = inputValue ? inputValue.trim() : '';
    
    if (!query || query.length < 2) {
      return [];
    }

    console.log('TagSelector: Searching for:', query); // Debug log

    try {
      const response = await api.get('/tags/search/', {
        params: { q: query }
      });
      
      const tags = response.data || [];
      console.log('TagSelector: Received tags:', tags.length); // Debug log
      
      if (tags.length > 0) {
        console.log('TagSelector: Sample tags:', tags.slice(0, 3)); // Debug log
      } else {
        console.log('TagSelector: No tags found, user can create new one');
      }
      
      // Convert to react-select format
      const formattedTags = tags.map(tag => {
        // Ensure value is consistent: use ID as number if available, otherwise use custom prefix
        const tagValue = tag.id ? Number(tag.id) : `custom_${tag.name}`;
        
        return {
          value: tagValue,
          label: tag.label || tag.name,
          name: tag.name,
          wikidata_id: tag.wikidata_id,
          description: tag.description,
          is_custom: tag.is_custom || !tag.id,
          source: tag.source || (tag.id ? 'local' : 'wikidata'),
          // Store full data for when creating new tags
          tagData: tag
        };
      });
      
      return formattedTags;
    } catch (error) {
      console.error('TagSelector: Error loading tags:', error);
      if (error.response) {
        console.error('TagSelector: Error status:', error.response.status);
        console.error('TagSelector: Error data:', error.response.data);
      }
      // Return empty array on error, user can still create new tags
      return [];
    }
  }, []);

  const handleChange = (selectedOptions) => {
    if (!onChange) return;
    
    console.log('TagSelector onChange called:', { isMulti, selectedOptionsCount: selectedOptions?.length || 0, selectedOptions });
    
    if (isMulti) {
      // Convert to format expected by backend
      // But also include name/label for frontend filtering
      const tags = (selectedOptions || []).map(option => {
        // If it's a created option (new tag)
        if (option.__isNew__) {
          return {
            name: option.value,
            label: option.value, // Add label for frontend display
            is_custom: true
          };
        }
        // If it's an existing tag with ID (can be number or string that represents number)
        if (option.value !== undefined && option.value !== null) {
          // Check if value is a number (either actual number or numeric string)
          const numValue = typeof option.value === 'number' ? option.value : parseInt(option.value, 10);
          if (!isNaN(numValue) && !option.value.toString().startsWith('custom_')) {
            return { 
              id: numValue,
              name: option.name || option.label, // Always include name for frontend filtering
              label: option.label || option.name,
              wikidata_id: option.wikidata_id,
              description: option.description,
              is_custom: option.is_custom
            };
          }
        }
        // If it's a custom tag (starts with custom_)
        if (option.value && option.value.toString().startsWith('custom_')) {
          return {
            name: option.name || option.label,
            label: option.label || option.name,
            wikidata_id: option.wikidata_id,
            description: option.description,
            is_custom: true
          };
        }
        // If option.value is a number, use it as id (react-select format)
        if (option.value && typeof option.value === 'number') {
          return {
            id: option.value,
            name: option.name || option.label,
            label: option.label || option.name,
            wikidata_id: option.wikidata_id,
            description: option.description
          };
        }
        // Fallback - ensure name and label are always present, check if id exists in option
        return { 
          id: option.id || (option.value && !isNaN(option.value) ? parseInt(option.value, 10) : undefined),
          name: option.name || option.label || option.value,
          label: option.label || option.name || option.value,
          wikidata_id: option.wikidata_id,
          description: option.description
        };
      });
      onChange(tags);
    } else {
      // Single select
      if (!selectedOptions) {
        onChange(null);
        return;
      }
      if (selectedOptions.__isNew__) {
        onChange({ name: selectedOptions.value, label: selectedOptions.value, is_custom: true });
      } else if (selectedOptions.value && typeof selectedOptions.value === 'number') {
        onChange({ 
          id: selectedOptions.value,
          name: selectedOptions.name || selectedOptions.label,
          label: selectedOptions.label || selectedOptions.name
        });
      } else {
        onChange({
          name: selectedOptions.name || selectedOptions.label,
          label: selectedOptions.label || selectedOptions.name,
          wikidata_id: selectedOptions.wikidata_id,
          description: selectedOptions.description,
          is_custom: selectedOptions.is_custom
        });
      }
    }
  };

  const formatCreateLabel = (inputValue) => {
    return `Create "${inputValue}"`;
  };

  // Convert value prop to react-select format
  const getSelectValue = () => {
    if (!value) return isMulti ? [] : null;
    
    if (isMulti) {
      if (!Array.isArray(value)) return [];
      
      return value.map(item => {
        // Handle different input formats
        if (!item) return null;
        
        // If it already has react-select format (value, label)
        if (item.value !== undefined) {
          return item;
        }
        
        // If it has id field
        if (item.id !== undefined && item.id !== null) {
          return {
            value: item.id,
            label: item.label || item.name || `Tag ${item.id}`,
            name: item.name || item.label,
            wikidata_id: item.wikidata_id,
            description: item.description,
            is_custom: item.is_custom
          };
        }
        
        // If it's a custom tag without id
        if (item.name) {
          return {
            value: `custom_${item.name}`,
            label: item.label || item.name,
            name: item.name,
            wikidata_id: item.wikidata_id,
            description: item.description,
            is_custom: true
          };
        }
        
        return null;
      }).filter(Boolean); // Remove null values
    } else {
      if (!value) return null;
      
      // If it already has react-select format
      if (value.value !== undefined) {
        return value;
      }
      
      if (value.id) {
        return {
          value: value.id,
          label: value.name || value.label || `Tag ${value.id}`,
          name: value.name
        };
      } else {
        return {
          value: `custom_${value.name}`,
          label: value.name || value.label,
          name: value.name,
          is_custom: true
        };
      }
    }
  };

  // Get current value in react-select format
  const selectValue = getSelectValue();
  
  // Debug: log current value
  if (isMulti && Array.isArray(selectValue)) {
    console.log('TagSelector Multi Value:', selectValue.length, 'tags', selectValue.map(v => ({ value: v.value, label: v.label })));
  }

  return (
    <AsyncCreatableSelect
      isMulti={isMulti}
      isDisabled={isDisabled}
      cacheOptions
      defaultOptions={showAllTagsOnOpen ? defaultOptions : false}
      loadOptions={loadOptions}
      onChange={handleChange}
      value={selectValue}
      placeholder={placeholder}
      formatCreateLabel={formatCreateLabel}
      getOptionValue={(option) => String(option.value)} // Ensure consistent value comparison
      getOptionLabel={(option) => option.label || option.name || String(option.value)} // Ensure label display
      isClearable={isMulti}
      noOptionsMessage={({ inputValue }) => {
        if (!inputValue || inputValue.length === 0) {
          return 'Start typing to search tags...';
        }
        if (inputValue.length === 1) {
          return 'Type at least 2 characters to search tags from database or Wikidata...';
        }
        return `No tags found for "${inputValue}". Press Enter to create this tag.`;
      }}
      loadingMessage={() => 'Searching tags...'}
      className="react-select-container"
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          borderColor: 'hsl(var(--input))',
          '&:hover': {
            borderColor: 'hsl(var(--input))',
          },
          minHeight: '42px',
        }),
        menu: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: 'hsl(var(--primary))',
          primary75: 'hsl(var(--primary) / 0.75)',
          primary50: 'hsl(var(--primary) / 0.5)',
          primary25: 'hsl(var(--primary) / 0.25)',
        },
      })}
    />
  );
};

export default TagSelector;

