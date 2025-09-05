using System.Text.RegularExpressions;

namespace ClimaCool.Application.Extensions
{
    public static class StringExtensions
    {
        public static string ToSlug(this string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return string.Empty;

            // Convert to lowercase
            value = value.ToLowerInvariant();

            // Remove accents
            value = RemoveAccents(value);

            // Replace spaces with hyphens
            value = Regex.Replace(value, @"\s+", "-", RegexOptions.Compiled);

            // Remove invalid characters
            value = Regex.Replace(value, @"[^a-z0-9\-]", "", RegexOptions.Compiled);

            // Remove duplicate hyphens
            value = Regex.Replace(value, @"\-+", "-", RegexOptions.Compiled);

            // Trim hyphens from start and end
            value = value.Trim('-');

            return value;
        }

        private static string RemoveAccents(string text)
        {
            var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
            var stringBuilder = new System.Text.StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
        }
    }
}