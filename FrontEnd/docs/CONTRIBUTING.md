# Guia de Contribuição - TimeTracker

Obrigado por se interessar em contribuir com o TimeTracker! Este documento fornece diretrizes e instruções para contribuidores.

## 🚀 Como Contribuir

### 1. Setup Inicial

```bash
# Clone o repositório
git clone https://github.com/fabrica-bayarea/Projeto-Bay-Area.git

# Entre no diretório
cd TimeTracker.Web

# Instale dependências (Frontend)
npm install

# Restaure pacotes (Backend)
dotnet restore
```

### 2. Crie uma Branch

```bash
# Sempre crie uma branch a partir de 'main'
git checkout -b feature/descricao-da-feature

# Ou para bug fixes
git checkout -b fix/descricao-do-bug

# Ou para documentação
git checkout -b docs/descricao-da-documentacao
```

### 3. Desenvolvimento

#### Frontend (React + Tailwind)

```bash
# Inicie servidor de desenvolvimento
npm run dev

# Estrutura de pastas para novos componentes:
src/components/
├── MyNewComponent.jsx     # Componente principal
└── MyNewComponent.test.js # Testes (se aplicável)

# Template de componente:
/**
 * MyNewComponent
 * @param {prop1Type} prop1 - Descrição
 * @param {prop2Type} prop2 - Descrição
 */
export function MyNewComponent({ prop1, prop2 }) {
  return (
    <div className="...">
      Conteúdo
    </div>
  );
}
```

#### Backend (C# + .NET)

```bash
# Compile e teste
dotnet build
dotnet test

# Watch mode para desenvolvimento
dotnet watch

# Estrutura de pastas para novos serviços:
Services/
├── IMyService.cs         # Interface
└── MyService.cs          # Implementação
```

### 4. Commit com Mensagens Descritivas

Siga o padrão de commits semânticos:

```bash
# Features
git commit -m "feat: adicionar novo componente de gráfico"

# Bug fixes
git commit -m "fix: corrigir bug na calculação de horas"

# Documentação
git commit -m "docs: atualizar guia de estilo"

# Refatoração
git commit -m "refactor: reorganizar estrutura de componentes"

# Testes
git commit -m "test: adicionar testes para MetricCard"

# Build/CI
git commit -m "ci: atualizar configuração do GitHub Actions"
```

### 5. Push e Pull Request

```bash
# Push sua branch
git push origin feature/descricao-da-feature

# Abra um Pull Request no GitHub
# Preencha o template com:
# - Descrição clara do que foi alterado
# - Motivo/contexto da mudança
# - Screenshots (se UI)
# - Checklist de verificação
```

## 📋 Padrões de Código

### JavaScript/React

```javascript
// ✅ BOM
/**
 * Componente bem documentado
 * @param {string} title - Título do card
 * @param {React.ReactNode} children - Conteúdo
 */
export function Card({ title, children }) {
  return (
    <article className="rounded-lg bg-white p-5">
      <h2>{title}</h2>
      {children}
    </article>
  );
}

// ❌ RUIM
function c({ t, c }) {
  return <article className="..."><h2>{t}</h2>{c}</article>;
}

// ✅ BOM - Hooks customizados
function MyComponent() {
  const [state, setState] = useState(initialValue);
  const memoized = useMemo(() => expensiveCalculation(), [deps]);
  return ...
}

// ❌ RUIM - Lógica complexa em componente
function MyComponent() {
  // Lógica que deveria estar em um hook customizado
  ...
}
```

### C# / .NET

```csharp
// ✅ BOM
/// <summary>
/// Obtém colaboradores ordenados por status
/// </summary>
public async Task<IEnumerable<Collaborator>> GetCollaboratorsAsync()
{
    return await _dbContext.Collaborators
        .OrderByDescending(c => c.IsOnline)
        .ToListAsync();
}

// ❌ RUIM
public List<Collaborator> GetCollaborators()
{
    return _dbContext.Collaborators.ToList();
}

// ✅ BOM - Injeção de dependência
public class CollaboratorService
{
    private readonly IRepository<Collaborator> _repository;

    public CollaboratorService(IRepository<Collaborator> repository)
    {
        _repository = repository;
    }
}

// ❌ RUIM - Sem injeção
public class CollaboratorService
{
    private Repository _repository = new Repository();
}
```

### CSS / Tailwind

```css
/* ✅ BOM - Classes bem organizadas */
@layer components {
  .card {
    @apply rounded-lg border border-line bg-white p-5 shadow-sm;
    @apply dark:border-slate-700 dark:bg-slate-900;
  }
}

/* ❌ RUIM - Classes espalhadas */
.my-card { border-radius: 0.5rem; ... }
.my-card-dark { ... }
```

```html
<!-- ✅ BOM - Estrutura semântica -->
<article class="card">
  <header>
    <h2>Título</h2>
  </header>
  <main>Conteúdo</main>
</article>

<!-- ❌ RUIM - Sem semântica -->
<div class="card">
  <div class="header"><div>Título</div></div>
  <div>Conteúdo</div>
</div>
```

## 🧪 Testes

### Frontend - Vitest + React Testing Library

```javascript
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  test('deve renderizar valor', () => {
    render(<MetricCard value="6h 42min" label="Tempo" />);
    expect(screen.getByText('6h 42min')).toBeInTheDocument();
  });

  test('deve aplicar classe positive quando positivo', () => {
    const { container } = render(
      <MetricCard value="100" positive={true} />
    );
    expect(container.querySelector('.positive')).toBeInTheDocument();
  });
});
```

### Backend - xUnit

```csharp
public class CollaboratorServiceTests
{
    private readonly CollaboratorService _service;
    private readonly Mock<IRepository> _mockRepository;

    public CollaboratorServiceTests()
    {
        _mockRepository = new Mock<IRepository>();
        _service = new CollaboratorService(_mockRepository.Object);
    }

    [Fact]
    public async Task GetAsync_WithValidId_ReturnsCollaborator()
    {
        // Arrange
        var id = 1;
        _mockRepository.Setup(r => r.GetAsync(id))
            .ReturnsAsync(new Collaborator { Id = id });

        // Act
        var result = await _service.GetAsync(id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(id, result.Id);
    }
}
```

## 📝 Documentação

- Atualize `README.md` se necessário
- Adicione comentários para lógica complexa
- Documente funções públicas com JSDoc (JS) ou XML Comments (C#)
- Atualize `STYLES.md` para mudanças de estilos
- Atualize `BACKEND.md` para mudanças na API

## ♿ Acessibilidade

Toda contribuição deve considerar acessibilidade:

```html
<!-- ✅ BOM -->
<button aria-label="Alternar tema" onClick={toggleTheme}>
  {dark ? '☀' : '☾'}
</button>

<!-- ❌ RUIM -->
<button onClick={toggleTheme}>🌙</button>
```

## 🔍 Checklist Antes de Fazer PR

- [ ] Código compila/executa sem erros
- [ ] Testes passam (`npm test`, `dotnet test`)
- [ ] Nenhuma quebra de build
- [ ] Mensagens de commit são descritivas
- [ ] Branch está atualizada com `main`
- [ ] Código segue padrões do projeto
- [ ] Documentação foi atualizada
- [ ] Não há `console.log`, `debugger` ou comentários de debug
- [ ] TypeScript/C# sem erros de tipo
- [ ] HTML/CSS acessível
- [ ] Responsivo (testar em mobile)
- [ ] Dark mode funciona (se aplicável)

## 🐛 Reportar Bugs

Use o [template de issue](https://github.com/fabrica-bayarea/Projeto-Bay-Area/issues/new):

```markdown
## Descrição
Descrição clara do bug

## Passos para Reproduzir
1. ...
2. ...
3. ...

## Comportamento Esperado
O que deveria acontecer

## Comportamento Atual
O que está acontecendo

## Screenshots
Se aplicável

## Ambiente
- OS: Windows/Mac/Linux
- Browser: Chrome/Firefox
- Versão do Node: 18.x
- Versão do .NET: 10.x
```

## 💡 Sugestões e Melhorias

Abra uma [discussion](https://github.com/fabrica-bayarea/Projeto-Bay-Area/discussions) para:
- Ideias de novas features
- Melhorias em funcionalidades existentes
- Discussões de arquitetura
- Perguntas gerais

## 🎓 Recursos Úteis

- [React Best Practices](https://react.dev/learn)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## 📞 Perguntas?

- Abra uma [discussion](https://github.com/fabrica-bayarea/Projeto-Bay-Area/discussions)
- Contate a equipe em [email]

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença MIT do projeto.

---

**Obrigado por contribuir! 🎉**
