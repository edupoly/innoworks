import axios from 'axios';
import { getGithubFile } from './github.js';

const TECH_MAP = {
  frontend: {
    'react': ['react'],
    'next.js': ['next'],
    'vue.js': ['vue'],
    'angular': ['@angular/core'],
    'svelte': ['svelte'],
    'tailwind css': ['tailwindcss'],
    'bootstrap': ['bootstrap'],
    'mui': ['@mui/material', '@material-ui/core'],
    'vite': ['vite'],
    'webpack': ['webpack'],
    'gulp': ['gulp'],
    'sass': ['sass', 'node-sass'],
  },
  backend: {
    'node.js': ['node'],
    'express': ['express'],
    'nest.js': ['@nestjs/core'],
    'fastify': ['fastify'],
    'django': ['django'],
    'flask': ['flask'],
    'fastapi': ['fastapi'],
    'spring boot': ['spring-boot'],
    'laravel': ['laravel/framework'],
    'go': ['go'],
    'rust': ['rust'],
    'ruby on rails': ['rails'],
    'elixir': ['phoenix'],
  },
  database: {
    'mongodb': ['mongoose', 'mongodb'],
    'postgresql': ['pg', 'postgres', 'pg-promise'],
    'mysql': ['mysql', 'mysql2'],
    'redis': ['redis', 'ioredis'],
    'prisma': ['@prisma/client'],
    'sequelize': ['sequelize'],
    'typeorm': ['typeorm'],
    'knex': ['knex'],
    'firebase': ['firebase-admin'],
  },
  devops: {
    'docker': ['dockerfile'],
    'kubernetes': ['k8s', 'kubernetes', 'helm'],
    'github actions': ['.github/workflows'],
    'circleci': ['.circleci'],
    'travis ci': ['.travis.yml'],
    'terraform': ['terraform', '.tf'],
    'aws': ['aws-sdk', '@aws-sdk', 'amplify'],
    'google cloud': ['@google-cloud'],
    'azure': ['@azure/'],
    'firebase': ['firebase'],
    'netlify': ['netlify.toml'],
    'vercel': ['vercel.json'],
  }
};

/**
 * Detects technologies used in a GitHub repository
 */
export const detectTechStack = async (accessToken, owner, repo) => {
  const techStack = new Set();
  
  try {
    // 1. Get root directory structure
    const { data: rootFiles } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    ).catch(() => ({ data: [] }));

    const fileNames = rootFiles.map(f => f.name.toLowerCase());
    const directories = rootFiles.filter(f => f.type === 'dir').map(f => f.name);

    // 2. Check for specific markers in root
    if (fileNames.includes('dockerfile')) techStack.add('Docker');
    if (fileNames.includes('docker-compose.yml') || fileNames.includes('docker-compose.yaml')) techStack.add('Docker Compose');
    if (fileNames.includes('.github')) techStack.add('GitHub Actions');
    if (fileNames.includes('terraform')) techStack.add('Terraform');
    if (fileNames.includes('go.mod')) techStack.add('Go');
    if (fileNames.includes('cargo.toml')) techStack.add('Rust');
    if (fileNames.includes('pom.xml') || fileNames.includes('build.gradle')) techStack.add('Java');

    // 3. Analyze package.json in root and subdirectories (monorepo support)
    const packageFiles = [];
    if (fileNames.includes('package.json')) packageFiles.push('package.json');
    
    // Scan first level directories for package.json
    for (const dir of directories.slice(0, 10)) { // Limit to 10 dirs for performance
      try {
        const { data: subFiles } = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${dir}`,
          {
            headers: {
              Authorization: `token ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        ).catch(() => ({ data: [] }));
        
        if (subFiles.some(f => f.name.toLowerCase() === 'package.json')) {
          packageFiles.push(`${dir}/package.json`);
        }
      } catch (e) {
        // Ignore directory parsing errors
      }
    }

    for (const pkgPath of packageFiles) {
      try {
        const fileContent = await getGithubFile(accessToken, owner, repo, pkgPath);
        if (fileContent && fileContent.content) {
          const pkg = JSON.parse(Buffer.from(fileContent.content, 'base64').toString('utf-8'));
          const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
          analyzeDependencies(deps, techStack);
        }
      } catch (e) {
        console.warn(`⚠️ Failed to parse ${pkgPath}:`, e.message);
      }
    }

    // 4. Analyze Python requirements if exists
    const pythonFiles = [];
    if (fileNames.includes('requirements.txt')) pythonFiles.push('requirements.txt');
    if (fileNames.includes('pyproject.toml')) techStack.add('Python');

    for (const pyPath of pythonFiles) {
      try {
        const fileContent = await getGithubFile(accessToken, owner, repo, pyPath);
        if (fileContent && fileContent.content) {
          const content = Buffer.from(fileContent.content, 'base64').toString('utf-8');
          const lowerContent = content.toLowerCase();
          if (lowerContent.includes('django')) techStack.add('Django');
          if (lowerContent.includes('flask')) techStack.add('Flask');
          if (lowerContent.includes('fastapi')) techStack.add('FastAPI');
          if (lowerContent.includes('pandas') || lowerContent.includes('numpy')) techStack.add('Data Science');
          if (lowerContent.includes('tensorflow') || lowerContent.includes('torch')) techStack.add('AI/ML');
        }
      } catch (e) {
        // Ignore parsing errors for Python files
      }
    }

    // 5. Get languages from GitHub API
    try {
      const { data: languages } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/languages`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      
      const totalSize = Object.values(languages).reduce((a, b) => a + b, 0);
      Object.entries(languages).forEach(([lang, size]) => {
        // Only add if it's more than 10% of the codebase or it's the only language
        if (size / totalSize > 0.1 || Object.keys(languages).length === 1) {
          techStack.add(lang);
        }
      });
    } catch (e) {
      // Ignore API errors
    }

    return Array.from(techStack);
  } catch (error) {
    console.error('❌ Tech detection failed:', error.message);
    return [];
  }
};

const analyzeDependencies = (deps, techStack) => {
  const depNames = Object.keys(deps).map(d => d.toLowerCase());
  
  for (const [, techs] of Object.entries(TECH_MAP)) {
    for (const [techName, markers] of Object.entries(techs)) {
      if (markers.some(marker => depNames.some(d => d.includes(marker)))) {
        // Use proper naming from mapping
        const displayName = techName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        techStack.add(displayName === 'Node.js' ? 'Node.js' : (displayName === 'Next.js' ? 'Next.js' : (displayName === 'Vue.js' ? 'Vue.js' : displayName)));
      }
    }
  }
};
