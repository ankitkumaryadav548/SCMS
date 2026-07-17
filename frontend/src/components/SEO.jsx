import { useEffect } from 'react';

/**
 * SEO Component dynamically updates the page title and meta description.
 */
const SEO = ({ title, description = 'Smart City Operations and Orchestration Management System Terminal.' }) => {
  useEffect(() => {
    // Dynamic page title
    document.title = title 
      ? `${title} | Smart City Terminal` 
      : 'Smart City Management Terminal';

    // Dynamic description tag
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [title, description]);

  return null;
};

export default SEO;
