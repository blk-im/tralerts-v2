import React from 'react';
import { FileText, Eye, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface PageData {
  page: string;
  views: number;
  uniqueVisitors: number;
  avgTime: string;
}

interface TopPagesProps {
  pages: PageData[];
}

export function TopPages({ pages }: TopPagesProps) {
  const getPageIcon = (page: string) => {
    if (page === '/') return '🏠';
    if (page === '/dashboard') return '📊';
    if (page === '/signup') return '✍️';
    if (page === '/pricing') return '💰';
    if (page === '/features') return '⭐';
    return '📄';
  };

  const getPageName = (page: string) => {
    const names: { [key: string]: string } = {
      '/': 'Page d\'accueil',
      '/dashboard': 'Dashboard',
      '/signup': 'Inscription',
      '/pricing': 'Tarifs',
      '/features': 'Fonctionnalités'
    };
    return names[page] || page;
  };

  const totalViews = pages.reduce((sum, page) => sum + page.views, 0);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-xl font-semibold flex items-center">
          <FileText className="w-5 h-5 mr-2 text-purple-600" />
          Pages les Plus Visitées
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pages.map((page, index) => {
            const viewPercentage = (page.views / totalViews) * 100;
            const conversionRate = (page.uniqueVisitors / page.views) * 100;
            
            return (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getPageIcon(page.page)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {getPageName(page.page)}
                      </p>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {page.page}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Eye className="w-3 h-3 text-blue-600 mr-1" />
                      <span className="font-bold text-blue-600">
                        {page.views.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {viewPercentage.toFixed(1)}% du trafic
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <span className="font-bold text-green-600">
                        {page.uniqueVisitors.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Visiteurs uniques
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="w-3 h-3 text-purple-600 mr-1" />
                      <span className="font-bold text-purple-600">
                        {page.avgTime}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Temps moyen
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm">
              Page la plus populaire
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs">
              {getPageName(pages[0]?.page)} avec {pages[0]?.views.toLocaleString()} vues
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="font-semibold text-green-800 dark:text-green-200 text-sm">
              Meilleur engagement
            </p>
            <p className="text-green-700 dark:text-green-300 text-xs">
              {pages.reduce((best, page) => 
                page.avgTime > best.avgTime ? page : best
              ).avgTime} temps moyen
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="font-semibold text-purple-800 dark:text-purple-200 text-sm">
              Total pages vues
            </p>
            <p className="text-purple-700 dark:text-purple-300 text-xs">
              {totalViews.toLocaleString()} vues sur la période
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}