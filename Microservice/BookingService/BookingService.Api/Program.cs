using System.Security.Claims;
using System.Text;
using BookingService.Api.Middleware;
using BookingService.Application.DTOs;
using BookingService.Application.Features.Appointments.Commands;
using BookingService.Application.Features.Appointments.Queries;
using BookingService.Application.Features.Transactions.Commands;
using BookingService.Application.Features.Transactions.Queries;
using BookingService.Application.Interfaces;
using BookingService.Application.Mappings;
using BookingService.Infrastructure.Persistence;
using BookingService.Infrastructure.Repositories;
using BookingService.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Refit;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .WriteTo.Console()
    .WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day)
    .Enrich.FromLogContext()
    .CreateLogger();

Log.Information("Starting Real Estate Management API...");

var builder = WebApplication.CreateBuilder(args);

// ── Database
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        connectionString,
        npgsqlOptions =>
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "Sabreen_BookingService")
    )
);
builder
    .Services.AddRefitClient<IPropertyApi>()
    .ConfigureHttpClient(c =>
    {
        c.BaseAddress = new Uri("http://localhost:5017");
    });

// This already exists 
builder
    .Services.AddRefitClient<IPropertyServiceClient>()
    .ConfigureHttpClient(c =>
    {
        c.BaseAddress = new Uri("http://localhost:5017");
    });

// ── JWT
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
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "BookingSertvice API", Version = "v1" });

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

builder
    .Services.AddRefitClient<INotificationServiceClient>()
    .ConfigureHttpClient(c =>
    {
        c.BaseAddress = new Uri("http://localhost:5163");
    });

builder.Services.AddMediatR(typeof(UpdateAppointmentStatusCommand).Assembly);
builder.Services.AddAutoMapper(typeof(AppointmentProfile).Assembly);

builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(typeof(CreateAppointmentRequest).Assembly);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();

app.UseStaticFiles();
app.UseAuthentication();

// Custom middleware for logging requests, responses, and role
app.Use(
    async (context, next) =>
    {
        Log.Information(
            "Incoming Request: {Method} {Path}",
            context.Request.Method,
            context.Request.Path
        );

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var role = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.IsNullOrEmpty(role))
            {
                Console.WriteLine($"User Role: {role}");
                Log.Information("User Role: {Role}", role);
            }
        }

        await next.Invoke();

        Log.Information("Response Status: {StatusCode}", context.Response.StatusCode);
    }
);

app.UseMiddleware<TokenBlacklistMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();

Log.CloseAndFlush();

// Required for integration testing
public partial class Program { }
