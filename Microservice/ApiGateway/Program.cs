using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// CONFIG
builder.Configuration.AddJsonFile("ocelot.json", false, true);

// AUTH
builder
    .Services.AddAuthentication("Bearer")
    .AddJwtBearer(
        "Bearer",
        options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = "RealEstateApi",
                ValidAudience = "RealEstateClient",
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes("YourSuperSecretKeyMustBeAtLeast32CharactersLong!")
                ),
                ClockSkew = TimeSpan.Zero,
            };
        }
    );
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowAngular",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:4200")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

builder.Services.AddAuthorization();

// OCELOT
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();
app.UseCors("AllowAngular");
// ORDER IS CRITICAL
app.UseAuthentication();
app.UseAuthorization();

await app.UseOcelot();

app.Run();
