using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using TimeTracker.Agent.Config;
using TimeTracker.Agent.Dtos;
using TimeTracker.Agent.Models;

namespace TimeTracker.Agent.Services;

public interface IApiClient
{
    Task<SystemSettingsDto?> GetSettingsAsync(
        CancellationToken ct = default
    );
    Task SendActivityAsync(
        ActivityLogCreateDto log, CancellationToken ct = default
    );
    Task<AssociationResult> AssociateAsync(
        string code, string username,
        string hostname, CancellationToken ct = default
    );
    void SetAuthToken(string? token);
}

public class HttpApiClient : IApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _http;
    private readonly ApiConfig _config;

    public HttpApiClient()
    {
        _config = AppConfig.Instance.Api;

        if (_config.RequireHttps &&
            !_config.BaseUrl.StartsWith(
                "https://", StringComparison.OrdinalIgnoreCase
            )
        )
        {
            // comunicação Agente-API deve ser HTTPS em prod
            // opcional em appsettings.json (Api.RequireHttps) apenas
            // para testes contra o uvicorn (HTTP).
            throw new InvalidOperationException(
                "A URL base da API deve usar HTTPS " +
                "(ou defina Api.RequireHttps=false para testes locais)."
            );
        }

        _http = new HttpClient
        {
            BaseAddress = new Uri(_config.BaseUrl),
            Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds)
        };
    }

    public async Task<SystemSettingsDto?> GetSettingsAsync(
        CancellationToken ct = default
    )
    {
        HttpResponseMessage response;
        response = await _http.GetAsync(
            _config.Endpoints.GetSettings, ct
        );

        response.EnsureSuccessStatusCode();

        return await (
            response
            .Content
            .ReadFromJsonAsync<SystemSettingsDto>(JsonOptions, ct)
        );
    }

    public async Task SendActivityAsync(
        ActivityLogCreateDto log, CancellationToken ct = default
    )
    {
        HttpResponseMessage response;
        response = await _http.PostAsJsonAsync(
            _config.Endpoints.SendActivity, log, JsonOptions, ct
        );

        response.EnsureSuccessStatusCode(); // 201 Created se OK
    }

    public void SetAuthToken(string? token)
    {
        AuthenticationHeaderValue? auth;
        auth = string.IsNullOrWhiteSpace(token) ? null : new("Bearer", token);

        _http.DefaultRequestHeaders.Authorization = auth;
    }

    // Envia o código de 6 dígitos junto com usuário Windows e hostname
    // Nunca lança por falha de rede/HTTP,
    // devolve um resultado com mensagem amigável
    public async Task<AssociationResult> AssociateAsync(
        string code, string username,
        string hostname, CancellationToken ct = default
    )
    {
        try
        {
            AssociateRequestDto request = new()
            {
                Code = code,
                Username = username,
                Hostname = hostname
            };
            HttpResponseMessage response = await _http.PostAsJsonAsync(
                _config.Endpoints.Associate, request, JsonOptions, ct
            );

            if (response.IsSuccessStatusCode)
            {
                AssociateResponseDto? body = (
                    await (
                        response
                        .Content
                        .ReadFromJsonAsync<AssociateResponseDto>(
                            JsonOptions, ct
                        )
                    )
                );
                string? token = body?.Token ?? body?.AccessToken;

                if (string.IsNullOrWhiteSpace(token))
                    return new AssociationResult(
                        AssociationOutcome.ServerError,
                        "O servidor respondeu sem o token de autorização. " +
                        "Tente novamente ou fale com o suporte."
                    );
                else
                    return new AssociationResult(
                        AssociationOutcome.Success,
                        "Associado com sucesso!",
                        token
                    );
            }

            // Respostas típicas para código inexistente/expirado/já usado
            // ou formato inválido.
            HashSet<HttpStatusCode> possibleErrors =
            [
                HttpStatusCode.BadRequest, HttpStatusCode.Unauthorized,
                HttpStatusCode.Forbidden, HttpStatusCode.NotFound,
                HttpStatusCode.Conflict, HttpStatusCode.Gone,
                HttpStatusCode.UnprocessableEntity
            ];

            if (possibleErrors.Contains(response.StatusCode))
                return new AssociationResult(
                    AssociationOutcome.InvalidCode,
                    "Código inválido ou expirado. " +
                    "Confira o código com seu gestor e tente novamente."
                );

            return new AssociationResult(
                AssociationOutcome.ServerError,
                "O servidor não conseguiu processar a solicitação agora. " +
                "Tente novamente em instantes."
            );
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return new AssociationResult(
                AssociationOutcome.ServerError,
                "Não foi possível conectar ao servidor. " +
                "Verifique sua conexão e tente novamente."
            );
        }
    }
}
