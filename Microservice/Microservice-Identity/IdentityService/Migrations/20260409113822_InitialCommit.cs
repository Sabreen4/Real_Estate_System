using System;
using System.Diagnostics.CodeAnalysis;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IdentityService.Migrations
{
    /// <inheritdoc />


    public partial class InitialCommit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "Sabreen_IdentityService");

            migrationBuilder.CreateTable(
                name: "RefSets",
                schema: "Sabreen_IdentityService",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefSets", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "RefTerms",
                schema: "Sabreen_IdentityService",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefTerms", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "SetRefTerms",
                schema: "Sabreen_IdentityService",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    RefSetId = table.Column<int>(type: "integer", nullable: false),
                    RefTermId = table.Column<int>(type: "integer", nullable: false),
                    CreatedDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SetRefTerms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SetRefTerms_RefSets_RefSetId",
                        column: x => x.RefSetId,
                        principalSchema: "Sabreen_IdentityService",
                        principalTable: "RefSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_SetRefTerms_RefTerms_RefTermId",
                        column: x => x.RefTermId,
                        principalSchema: "Sabreen_IdentityService",
                        principalTable: "RefTerms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Users",
                schema: "Sabreen_IdentityService",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    RoleId = table.Column<int>(type: "integer", nullable: false),
                    FirstName = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: false
                    ),
                    LastName = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: false
                    ),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_RefTerms_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "Sabreen_IdentityService",
                        principalTable: "RefTerms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.InsertData(
                schema: "Sabreen_IdentityService",
                table: "RefSets",
                columns: new[]
                {
                    "Id",
                    "CreatedBy",
                    "CreatedDate",
                    "Description",
                    "IsActive",
                    "IsDeleted",
                    "Key",
                    "UpdatedBy",
                    "UpdatedDate",
                },
                values: new object[]
                {
                    100,
                    null,
                    new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                    "User Roles",
                    true,
                    false,
                    "ROLE",
                    null,
                    null,
                }
            );

            migrationBuilder.InsertData(
                schema: "Sabreen_IdentityService",
                table: "RefTerms",
                columns: new[]
                {
                    "Id",
                    "CreatedBy",
                    "CreatedDate",
                    "Description",
                    "IsActive",
                    "IsDeleted",
                    "Key",
                    "UpdatedBy",
                    "UpdatedDate",
                },
                values: new object[,]
                {
                    {
                        10,
                        null,
                        new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                        "Administrator",
                        true,
                        false,
                        "ADMIN",
                        null,
                        null,
                    },
                    {
                        20,
                        null,
                        new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                        "Agent/Seller",
                        true,
                        false,
                        "AGENT",
                        null,
                        null,
                    },
                    {
                        30,
                        null,
                        new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                        "Buyer/Renter",
                        true,
                        false,
                        "BUYER",
                        null,
                        null,
                    },
                }
            );

            migrationBuilder.InsertData(
                schema: "Sabreen_IdentityService",
                table: "SetRefTerms",
                columns: new[]
                {
                    "Id",
                    "CreatedBy",
                    "CreatedDate",
                    "IsActive",
                    "IsDeleted",
                    "RefSetId",
                    "RefTermId",
                    "UpdatedBy",
                    "UpdatedDate",
                },
                values: new object[,]
                {
                    {
                        1,
                        null,
                        new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                        true,
                        false,
                        100,
                        10,
                        null,
                        null,
                    },
                    {
                        2,
                        null,
                        new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                        true,
                        false,
                        100,
                        20,
                        null,
                        null,
                    },
                    {
                        3,
                        null,
                        new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                        true,
                        false,
                        100,
                        30,
                        null,
                        null,
                    },
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_SetRefTerms_RefSetId",
                schema: "Sabreen_IdentityService",
                table: "SetRefTerms",
                column: "RefSetId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_SetRefTerms_RefTermId",
                schema: "Sabreen_IdentityService",
                table: "SetRefTerms",
                column: "RefTermId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                schema: "Sabreen_IdentityService",
                table: "Users",
                column: "RoleId"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "SetRefTerms", schema: "Sabreen_IdentityService");

            migrationBuilder.DropTable(name: "Users", schema: "Sabreen_IdentityService");

            migrationBuilder.DropTable(name: "RefSets", schema: "Sabreen_IdentityService");

            migrationBuilder.DropTable(name: "RefTerms", schema: "Sabreen_IdentityService");
        }
    }
}
