using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenSearch.Client;
using ClimaCool.Application.Services;
using ClimaCool.Infrastructure.Search;

namespace ClimaCool.Infrastructure.Extensions
{
    public static partial class ServiceCollectionExtensions
    {
        public static IServiceCollection AddSearchServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Configure OpenSearch settings
            services.Configure<OpenSearchConfig>(configuration.GetSection("OpenSearch"));
            
            // Configure OpenSearch client
            services.AddSingleton<IOpenSearchClient>(provider =>
            {
                var config = configuration.GetSection("OpenSearch").Get<OpenSearchConfig>() ?? new OpenSearchConfig();
                
                var settings = new ConnectionSettings(new Uri(config.Url))
                    .DefaultIndex(config.ProductIndex)
                    .DisableDirectStreaming()
                    .RequestTimeout(TimeSpan.FromMilliseconds(config.RequestTimeout));

                if (!string.IsNullOrEmpty(config.Username) && !string.IsNullOrEmpty(config.Password))
                {
                    settings = settings.BasicAuthentication(config.Username, config.Password);
                }

                if (config.EnableLogging)
                {
                    settings = settings.EnableDebugMode().PrettyJson();
                }

                return new OpenSearchClient(settings);
            });

            // Register search service
            services.AddScoped<ISearchService, SearchService>();

            return services;
        }
    }
}