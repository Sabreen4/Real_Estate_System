using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PropertyService.Api.Middleware;
using PropertyService.Application.Features.Properties.Command;
using PropertyService.Application.Interfaces;
using PropertyService.Application.Mappings;
using PropertyService.Application.Services;
using PropertyService.Infrastructure.Persistence;
using PropertyService.Infrastructure.Repositories;
using PropertyService.Infrastructure.UserSyncService;
using Refit;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .WriteTo.Console()
    .WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day)
    .Enrich.FromLogContext()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog();

// ================= DATABASE =================
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options
        .UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npgsqlOptions =>
                npgsqlOptions.MigrationsHistoryTable(
                    "__EFMigrationsHistory",
                    "Sabreen_PropertyServiceManagement"
                )
        )
        .UseSnakeCaseNamingConvention()
);

// ================= JWT AUTH =================
var jwtKey = builder.Configuration["Jwt:Key"];
builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
        };
    });

// =========================
// Swagger with JWT
// =========================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PropertyService API", Version = "v1" });

    c.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter 'Bearer {token}'",
        }
    );

    c.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                Array.Empty<string>()
            },
        }
    );
});

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();

// ================= FILE VALIDATION =================
builder.Services.AddSingleton(
    new FileValidationOptions
    {
        MaxFileSizeBytes = 5 * 1024 * 1024,
        MaxFileCount = 10,
        AllowedMimeTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" },
    }
);

builder.Services.AddScoped<IFileValidationService, FileValidationService>();

// ================= MEDIATR =================
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(CreatePropertyCommand).Assembly)
);

// ================= AUTOMAPPER =================
builder.Services.AddAutoMapper(typeof(OfferProfile).Assembly);

// ================= REPOSITORIES =================
builder.Services.AddScoped<IPropertyRepository, PropertyRepository>();
builder.Services.AddScoped<IPropertyImageRepository, PropertyImageRepository>();
builder.Services.AddScoped<IOfferRepository, OfferRepository>();
builder.Services.AddScoped<IUserContextService, UserContextService>();
builder.Services.AddScoped<UserSyncService>();

// ================= FLUENT VALIDATION =================
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(typeof(CreatePropertyCommand).Assembly);

// ================= CONTROLLERS =================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// ================= SWAGGER =================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ================= MIDDLEWARE =================
app.UseMiddleware<ExceptionMiddleware>();
app.Use(
    async (context, next) =>
    {
        Log.Information(
            "Incoming Request: {Method} {Path}",
            context.Request.Method,
            context.Request.Path
        );

        await next();

        Log.Information("Response Status: {StatusCode}", context.Response.StatusCode);
    }
);

app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// ================= REQUEST LOGGING =================

app.MapControllers();

//app.cors();

app.Run();

public partial class Program { }
