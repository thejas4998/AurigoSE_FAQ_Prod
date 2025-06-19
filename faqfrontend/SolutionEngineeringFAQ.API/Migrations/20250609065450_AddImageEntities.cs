using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SolutionEngineeringFAQ.API.Migrations
{
    /// <inheritdoc />
    public partial class AddImageEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnswerImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnswerImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnswerImages_Answers_AnswerId",
                        column: x => x.AnswerId,
                        principalTable: "Answers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: false),
                    QuestionId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionImages_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnswerImages_AnswerId",
                table: "AnswerImages",
                column: "AnswerId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionImages_QuestionId",
                table: "QuestionImages",
                column: "QuestionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnswerImages");

            migrationBuilder.DropTable(
                name: "QuestionImages");
        }
    }
}
